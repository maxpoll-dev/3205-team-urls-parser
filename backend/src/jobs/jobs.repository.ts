/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common'
import { type Job, JobStatus, UrlResult } from './entities/job.entity'

@Injectable()
export class JobsRepository {
  // Имитация хранилища. Старался максимально приблизить к работе с BD | ORM
  // Все обращения к DB через await
  private readonly jobs = new Map<string, Job>()

  async getList(): Promise<Job[]> {
    return [...this.jobs.values()] // await
  }

  async getById(id: string): Promise<Job | undefined> {
    const job = this.jobs.get(id)
    return job ? { ...job } : undefined
  }

  async create(job: Job): Promise<void> {
    this.jobs.set(job.id, job)
  }

  async updateJob(id: string, params: Partial<Job>): Promise<void> {
    const job = this.jobs.get(id) as Job
    this.jobs.set(id, { ...job, ...params })
  }

  async updateUrl(
    id: string,
    url: string,
    params: Partial<UrlResult>
  ): Promise<void> {
    const job = this.jobs.get(id) as Job
    const urls = job.urls.map((i) => (i.url === url ? { ...i, ...params } : i))

    this.jobs.set(id, { ...job, urls })
  }

  async cancelById(id: string): Promise<void> {
    const job = this.jobs.get(id) as Job
    this.jobs.set(id, { ...job, status: JobStatus.Cancelled })
  }
}
