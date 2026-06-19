import { Injectable } from '@nestjs/common'
import { JobsRepository } from './jobs.repository'
import { Job, JobStatus, UrlStatus, UrlResult } from './entities/job.entity'

@Injectable()
export class JobsProcessor {
  constructor(private readonly repository: JobsRepository) {}

  async runJob(jobId: string): Promise<void> {
    const job = await this.repository.getById(jobId)
    if (!job) return

    await this.repository.updateJob(jobId, {
      status: JobStatus.InProgress
    })

    const indexes = job.urls.map((_, i) => i)
    await this.runPool(jobId, indexes, 5)

    const jobFinish = (await this.repository.getById(jobId)) as Job
    if (jobFinish.status !== JobStatus.Cancelled) {
      const failed = jobFinish.urls.every((u) => u.status === UrlStatus.Error)

      await this.repository.updateJob(jobId, {
        status: failed ? JobStatus.Failed : JobStatus.Completed
      })
    }
  }

  private async checkUrl(jobId: string, index: number): Promise<void> {
    const job = await this.repository.getById(jobId)
    if (!job) return

    const { url } = job.urls[index]

    if (job.status === JobStatus.Cancelled) {
      await this.repository.updateUrl(jobId, index, {
        status: UrlStatus.Cancelled
      })
      return
    }

    const startedAt = new Date()
    await this.repository.updateUrl(jobId, index, {
      status: UrlStatus.InProgress,
      startedAt
    })

    const result: Partial<UrlResult> = {}

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10_000)
      })

      result.status = res.ok ? UrlStatus.Success : UrlStatus.Error
      result.httpStatus = res.status
    } catch (error) {
      result.status = UrlStatus.Error
      result.error = (error as Error).message
    } finally {
      await this.sleep(Math.random() * 10_000)

      const finishedAt = new Date()
      result.finishedAt = finishedAt
      result.duration = finishedAt.getTime() - startedAt.getTime()

      await this.repository.updateUrl(jobId, index, result)
    }
  }

  private async runPool(
    jobId: string,
    indexes: number[],
    limit: number
  ): Promise<void> {
    // Нарезать на 5 элементов и отдавать в Promise.all не подходит для этой задачи. all будет ждать самый последний промис.
    // Тут если честно пользовался Клодом,
    // но ИИ предлагала вынести функции runPool и sleep в утилиты, а так же сделать дополнительный параметр worker в runPool.
    // Для тест задачи решил просто передавать айди джобы в runPool и прокидывать в checkUrl
    const queue = [...indexes]
    const workers = Array.from(
      { length: Math.min(limit, queue.length) },
      async () => {
        while (queue.length) {
          const item = queue.shift()
          await this.checkUrl(jobId, item as number)
        }
      }
    )

    // В проде использовал бы готовое решение по типу p-limit
    await Promise.all(workers)
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
