export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed'

export type UrlStatus = 'pending' | 'in_progress' | 'success' | 'error' | 'cancelled'

export interface UrlResult {
  url: string
  status: UrlStatus
  httpStatus?: number
  error?: string
  startedAt?: string
  finishedAt?: string
  duration?: number
}

export interface Stats {
  total: number
  pending: number
  inProgress: number
  success: number
  error: number
  cancelled: number
  successRate: number
  errorRate: number
}

export interface JobView {
  id: string
  status: JobStatus
  createdAt: string
  urls: UrlResult[]
  stats: Stats
}

export type JobListItem = Omit<JobView, 'urls'>

export const DONE_STATUSES: JobStatus[] = ['completed', 'cancelled', 'failed']
