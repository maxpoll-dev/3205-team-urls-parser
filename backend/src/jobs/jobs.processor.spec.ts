import { JobsProcessor } from './jobs.processor'
import { JobsRepository } from './jobs.repository'
import { type Job, JobStatus, UrlStatus } from './entities/job.entity'

const seed = async (repo: JobsRepository, urls: string[]): Promise<void> => {
  const job: Job = {
    id: 'job-1',
    status: JobStatus.Pending,
    createdAt: new Date(),
    urls: urls.map((url) => ({ url, status: UrlStatus.Pending }))
  }
  await repo.create(job)
}

const mockFetch = (impl: () => Promise<Partial<Response>>) => {
  global.fetch = jest.fn(impl) as unknown as typeof fetch
}

describe('JobsProcessor', () => {
  let repo: JobsRepository
  let processor: JobsProcessor

  beforeEach(() => {
    repo = new JobsRepository()
    processor = new JobsProcessor(repo)

    // не ждём реальные 0–10с
    jest
      .spyOn(processor as unknown as { sleep: () => Promise<void> }, 'sleep')
      .mockResolvedValue(undefined)
    // не заводим реальный 10с-таймер на каждый запрос
    jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(new AbortController().signal)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('does nothing for an unknown job', async () => {
    const updateJob = jest.spyOn(repo, 'updateJob')

    await expect(processor.runJob('missing')).resolves.toBeUndefined()
    expect(updateJob).not.toHaveBeenCalled()
  })

  it('marks the job in_progress then completed when all urls succeed', async () => {
    await seed(repo, ['https://a.com', 'https://b.com'])
    mockFetch(async () => ({ ok: true, status: 200 }))
    const updateJob = jest.spyOn(repo, 'updateJob')

    await processor.runJob('job-1')

    expect(updateJob.mock.calls[0][1]).toEqual({ status: JobStatus.InProgress })

    const job = (await repo.getById('job-1')) as Job
    expect(job.status).toBe(JobStatus.Completed)
    expect(job.urls.map((u) => u.status)).toEqual([
      UrlStatus.Success,
      UrlStatus.Success
    ])
    expect(job.urls[0].httpStatus).toBe(200)
    expect(job.urls[0].startedAt).toBeInstanceOf(Date)
    expect(job.urls[0].finishedAt).toBeInstanceOf(Date)
  })

  it('marks the job failed when every url errors', async () => {
    await seed(repo, ['https://a.com', 'https://b.com'])
    mockFetch(async () => {
      throw new Error('network down')
    })

    await processor.runJob('job-1')

    const job = (await repo.getById('job-1')) as Job
    expect(job.status).toBe(JobStatus.Failed)
    expect(job.urls.every((u) => u.status === UrlStatus.Error)).toBe(true)
    expect(job.urls[0].error).toBe('network down')
    expect(typeof job.urls[0].duration).toBe('number')
  })

  it('completes (not failed) when only some urls fail', async () => {
    await seed(repo, ['https://ok.com', 'https://bad.com'])
    mockFetch(async () => {
      const url = (global.fetch as jest.Mock).mock.calls.length
      return url === 1 ? { ok: true, status: 200 } : { ok: false, status: 404 }
    })

    await processor.runJob('job-1')

    const job = (await repo.getById('job-1')) as Job
    expect(job.status).toBe(JobStatus.Completed)
    const statuses = job.urls.map((u) => u.status).sort()
    expect(statuses).toEqual([UrlStatus.Error, UrlStatus.Success].sort())
  })

  it('processes every url exactly once with at most 5 concurrent requests', async () => {
    const urls = Array.from({ length: 12 }, (_, i) => `https://site-${i}.com`)
    await seed(repo, urls)

    let active = 0
    let maxActive = 0
    mockFetch(async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((r) => setImmediate(r))
      active--
      return { ok: true, status: 200 }
    })

    await processor.runJob('job-1')

    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(12)
    expect(maxActive).toBe(5)
  })

  it('keeps the cancelled status and does not overwrite it at the end', async () => {
    await seed(
      repo,
      Array.from({ length: 8 }, (_, i) => `https://s-${i}.com`)
    )
    mockFetch(async () => {
      await repo.cancelById('job-1') // имитируем DELETE во время обработки
      return { ok: true, status: 200 }
    })

    await processor.runJob('job-1')

    const job = (await repo.getById('job-1')) as Job
    expect(job.status).toBe(JobStatus.Cancelled)
  })
})
