import { randomUUID } from 'node:crypto'
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger
} from '@nestjs/common'
import { JobsRepository } from './jobs.repository'
import { JobsProcessor } from './jobs.processor'
import { CreateJobsBodyDto } from './dto/create-jobs.body.dto'
import {
  type Job,
  type JobView,
  type Stats,
  type UrlResult,
  JobStatus,
  UrlStatus
} from './entities/job.entity'

@Injectable()
export class JobsService {
  constructor(
    private readonly repository: JobsRepository,
    private readonly processor: JobsProcessor
  ) {}

  // async добавил намеренно что бы прокидывать промисы с репозитория и приблизить поведение к DB | ORM
  async getList(): Promise<JobView[]> {
    const jobs = await this.repository.getList()
    return jobs.map((job) => this.toView(job))
  }

  async getById(id: string): Promise<JobView> {
    const job = await this.repository.getById(id)
    if (!job) throw new NotFoundException(`Job ${id} not found`)

    return this.toView(job)
  }

  async create(dto: CreateJobsBodyDto): Promise<{ jobId: string }> {
    const job: Job = {
      id: randomUUID(),
      status: JobStatus.Pending,
      createdAt: new Date(),
      urls: dto.urls.map((url) => ({ url, status: UrlStatus.Pending }))
    }

    await this.repository.create(job)
    this.processor
      .runJob(job.id)
      .catch((error) =>
        new Logger(JobsService.name).error(`runJob ${job.id} failed`, error)
      )

    return { jobId: job.id }
  }

  async cancelById(id: string): Promise<void> {
    const job = await this.repository.getById(id)

    if (!job) throw new NotFoundException(`Job ${id} not found`)
    if (job.status === JobStatus.Cancelled)
      throw new ConflictException(`Job ${id} is already cancelled`)

    await this.repository.cancelById(id)
  }

  private toView(job: Job): JobView {
    return { ...job, stats: this.buildStats(job.urls) }
  }

  private buildStats(urls: UrlResult[]): Stats {
    const total = urls.length
    const count = (status: UrlStatus) =>
      urls.filter((u) => u.status === status).length
    const percent = (n: number) => Math.round((n / total) * 100)

    const success = count(UrlStatus.Success)
    const error = count(UrlStatus.Error)

    return {
      total,
      pending: count(UrlStatus.Pending),
      inProgress: count(UrlStatus.InProgress),
      success,
      error,
      cancelled: count(UrlStatus.Cancelled),
      successRate: percent(success),
      errorRate: percent(error)
    }
  }
}
