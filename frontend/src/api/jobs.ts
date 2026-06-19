import { http } from './http'
import type { JobView, JobListItem } from '@/types/job'

export function getJobs() {
  return http<JobListItem[]>('/jobs')
}

export function getJob(id: string) {
  return http<JobView>(`/jobs/${id}`)
}

export function createJob(urls: string[]) {
  return http<{ jobId: string }>('/jobs', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  })
}

export function cancelJob(id: string) {
  return http<void>(`/jobs/${id}`, {
    method: 'DELETE',
  })
}
