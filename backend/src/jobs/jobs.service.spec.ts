import { ConflictException, NotFoundException, Logger } from '@nestjs/common'
import { JobsService } from './jobs.service'
import { JobsRepository } from './jobs.repository'
import { JobsProcessor } from './jobs.processor'
import { type Job, JobStatus, UrlStatus } from './entities/job.entity'

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  status: JobStatus.Pending,
  createdAt: new Date('2026-01-01'),
  urls: [{ url: 'https://a.com', status: UrlStatus.Pending }],
  ...overrides
})

describe('JobsService', () => {
  let service: JobsService
  let repository: jest.Mocked<JobsRepository>
  let processor: jest.Mocked<JobsProcessor>

  beforeEach(() => {
    repository = {
      getList: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      cancelById: jest.fn()
    } as unknown as jest.Mocked<JobsRepository>

    processor = {
      runJob: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<JobsProcessor>

    service = new JobsService(repository, processor)
  })

  describe('getById', () => {
    it('throws NotFoundException when job is missing', async () => {
      repository.getById.mockResolvedValue(undefined)

      await expect(service.getById('nope')).rejects.toThrow(NotFoundException)
    })

    it('returns the job with computed stats', async () => {
      repository.getById.mockResolvedValue(
        makeJob({
          urls: [
            { url: 'a', status: UrlStatus.Success },
            { url: 'b', status: UrlStatus.Success },
            { url: 'c', status: UrlStatus.Error },
            { url: 'd', status: UrlStatus.Pending }
          ]
        })
      )

      const view = await service.getById('job-1')

      expect(view.stats).toEqual({
        total: 4,
        pending: 1,
        inProgress: 0,
        success: 2,
        error: 1,
        cancelled: 0,
        successRate: 50,
        errorRate: 25
      })
    })

    it('rounds rates to whole percent', async () => {
      repository.getById.mockResolvedValue(
        makeJob({
          urls: [
            { url: 'a', status: UrlStatus.Success },
            { url: 'b', status: UrlStatus.Error },
            { url: 'c', status: UrlStatus.Error }
          ]
        })
      )

      const view = await service.getById('job-1')

      expect(view.stats.successRate).toBe(33)
      expect(view.stats.errorRate).toBe(67)
    })
  })

  describe('getList', () => {
    it('maps every job to a view with stats', async () => {
      repository.getList.mockResolvedValue([makeJob({ id: '1' }), makeJob({ id: '2' })])

      const list = await service.getList()

      expect(list).toHaveLength(2)
      expect(list[0]).toHaveProperty('stats')
      expect(list[1]).toHaveProperty('stats')
    })
  })

  describe('create', () => {
    it('persists a pending job and returns its id', async () => {
      const res = await service.create({ urls: ['https://a.com', 'https://b.com'] })

      expect(typeof res.jobId).toBe('string')
      expect(repository.create).toHaveBeenCalledTimes(1)

      const saved = repository.create.mock.calls[0][0]
      expect(saved.id).toBe(res.jobId)
      expect(saved.status).toBe(JobStatus.Pending)
      expect(saved.urls).toEqual([
        { url: 'https://a.com', status: UrlStatus.Pending },
        { url: 'https://b.com', status: UrlStatus.Pending }
      ])
    })

    it('kicks off processing with the created id', async () => {
      const res = await service.create({ urls: ['https://a.com'] })

      expect(processor.runJob).toHaveBeenCalledWith(res.jobId)
    })

    it('resolves even if background processing rejects', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
      processor.runJob.mockRejectedValue(new Error('boom'))

      await expect(service.create({ urls: ['https://a.com'] })).resolves.toHaveProperty('jobId')
      await Promise.resolve() // flush the .catch handler
    })
  })

  describe('cancelById', () => {
    it('throws NotFoundException when job is missing', async () => {
      repository.getById.mockResolvedValue(undefined)

      await expect(service.cancelById('nope')).rejects.toThrow(NotFoundException)
      expect(repository.cancelById).not.toHaveBeenCalled()
    })

    it('throws ConflictException when already cancelled', async () => {
      repository.getById.mockResolvedValue(makeJob({ status: JobStatus.Cancelled }))

      await expect(service.cancelById('job-1')).rejects.toThrow(ConflictException)
      expect(repository.cancelById).not.toHaveBeenCalled()
    })

    it('cancels an active job', async () => {
      repository.getById.mockResolvedValue(makeJob({ status: JobStatus.InProgress }))

      await service.cancelById('job-1')

      expect(repository.cancelById).toHaveBeenCalledWith('job-1')
    })
  })
})