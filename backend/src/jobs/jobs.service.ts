import { randomUUID } from 'node:crypto'
import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import { JobsRepository } from "./jobs.repository"
import { CreateJobsBodyDto } from "./dto/create-jobs.body.dto"
import { type Job, JobStatus, UrlStatus } from "./entities/job.entity"


@Injectable()
export class JobsService {
  constructor(private readonly repository: JobsRepository) {}

  // async добавил намеренно что бы прокидывать промисы с репозитория и приблизить поведение к DB | ORM
  async getList(): Promise<Job[]> {
    return this.repository.getList()
  }

  async getById(id: string): Promise<Job> {
    const job = await this.repository.getById(id)
    if (!job) throw new NotFoundException(`Job ${id} not found`)

    return job
  }

  async create(dto: CreateJobsBodyDto): Promise<void> {
    const job: Job = {
      id: randomUUID(),
      status: JobStatus.Pending,
      createdAt: new Date(),
      urls: dto.urls.map(url => ({ url, status: UrlStatus.Pending })),
    }

    await this.repository.create(job)
  }

  async cancelById(id: string): Promise<void> {
    const job = await this.repository.getById(id)

    if (!job) throw new NotFoundException(`Job ${id} not found`)
    if (job.status === JobStatus.Cancelled) throw new ConflictException(`Job ${id} is already cancelled`)

    await this.repository.cancelById(id)
  }
}
