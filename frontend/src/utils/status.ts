import type { JobStatus, UrlStatus } from '@/types/job'

export type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

export function jobStatusTagType(status: JobStatus): TagType {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'in_progress':
      return 'warning'
    default:
      return 'info'
  }
}

export function urlStatusTagType(status: UrlStatus): TagType {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    case 'in_progress':
      return 'warning'
    default:
      return 'info'
  }
}
