import { Injectable } from '@nestjs/common'
import { JobsRepository } from './jobs.repository'
import { Job, JobStatus, UrlStatus } from './entities/job.entity'

@Injectable()
export class JobsProcessor {
  constructor(private readonly repository: JobsRepository) {}

  async runJob(jobId: string): Promise<void> {
    const job = await this.repository.getById(jobId)
    if (!job) return

    await this.repository.updateJob(jobId, {
      status: JobStatus.InProgress
    })

    const urls = job.urls.map((u) => u.url)
    await this.runPool(jobId, urls, 5)

    const jobFinish = (await this.repository.getById(jobId)) as Job
    if (jobFinish.status !== JobStatus.Cancelled) {
      const failed = jobFinish.urls.every((u) => u.status === UrlStatus.Error)

      await this.repository.updateJob(jobId, {
        status: failed ? JobStatus.Failed : JobStatus.Completed
      })
    }
  }

  private async checkUrl(jobId: string, url: string): Promise<void> {
    const job = await this.repository.getById(jobId)
    if (!job) return

    if (job.status === JobStatus.Cancelled) {
      await this.repository.updateUrl(jobId, url, {
        status: UrlStatus.Cancelled
      })
      return
    }

    const startedAt = new Date()
    await this.repository.updateUrl(jobId, url, {
      status: UrlStatus.InProgress,
      startedAt
    })

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10_000)
      })

      await this.sleep(Math.random() * 10_000)
      await this.repository.updateUrl(jobId, url, {
        status: res.ok ? UrlStatus.Success : UrlStatus.Error,
        httpStatus: res.status,
        finishedAt: new Date()
      })
    } catch (error) {
      await this.sleep(Math.random() * 10_000)

      const finishedAt = new Date()
      await this.repository.updateUrl(jobId, url, {
        status: UrlStatus.Error,
        error: (error as Error).message,
        finishedAt,
        duration: finishedAt.getTime() - startedAt.getTime()
      })
    }
  }

  private async runPool(
    jobId: string,
    urls: string[],
    limit: number
  ): Promise<void> {
    // Нарезать на 5 элементов и отдавать в Promise.all не подходит для этой задачи. all будет ждать самый последний промис.
    // В проде использовал бы готовое решение по типу p-limit,
    const queue = [...urls]
    const workers = Array.from(
      { length: Math.min(limit, queue.length) },
      async () => {
        while (queue.length) {
          const item = queue.shift()
          await this.checkUrl(jobId, item as string)
        }
      }
    )

    await Promise.all(workers)
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
