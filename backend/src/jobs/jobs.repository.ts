import { Injectable } from "@nestjs/common"
import { type Job, JobStatus } from "./entities/job.entity"

@Injectable()
export class JobsRepository {
  // Имитация хранилища. Старался максимально приблизить к работе с BD | ORM
  private readonly jobs = new Map<string, Job>()

  async getList(): Promise<Job[]> {
    return [...this.jobs.values()]
  }

  async getById(id: string): Promise<Job | undefined> {
    const job = this.jobs.get(id)
    return job ? { ...job } : undefined
  }

  async create(job: Job): Promise<void> {
    this.jobs.set(job.id, job)
  }

  async cancelById(id: string): Promise<void> {
    const job = this.jobs.get(id) as Job
    this.jobs.set(id, { ...job, status: JobStatus.Cancelled })
  }
}
