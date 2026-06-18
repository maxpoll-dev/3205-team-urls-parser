export enum JobStatus {
  Pending    = 'pending',
  InProgress = 'in_progress',
  Completed  = 'completed',
  Cancelled  = 'cancelled',
  Failed     = 'failed',
}

export enum UrlStatus {
  Pending    = 'pending',
  InProgress = 'in_progress',
  Success    = 'success',
  Error      = 'error',
  Cancelled  = 'cancelled'
}

export interface UrlResult {
  url: string
  status: UrlStatus
  httpStatus?: number
  error?: string
  startedAt?: Date
  finishedAt?: Date
}

export interface Job {
  id: string
  status: JobStatus
  createdAt: Date
  urls: UrlResult[]
}