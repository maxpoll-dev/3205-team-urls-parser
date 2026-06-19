import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { ApiError } from '@/api/http'
import * as api from '@/api/jobs'

import { type JobView, type JobListItem, DONE_STATUSES } from '@/types/job'

const POLL_INTERVAL = 1500

function toErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.messages.length) {
    return e.messages.join('\n')
  }

  return 'The service is unavailable, please try again later'
}

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobListItem[]>([])
  const activeJob = ref<JobView | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let jobId: string | null = null

  function isDone(job: JobView | null) {
    return !!job && DONE_STATUSES.includes(job.status)
  }

  const isActiveJobDone = computed(() => isDone(activeJob.value))

  async function fetchJobs() {
    jobs.value = await api.getJobs()
  }

  async function createJob(urls: string[]): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const { jobId } = await api.createJob(urls)
      await fetchJobs()

      return jobId
    } catch (e) {
      error.value = toErrorMessage(e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadJob(id: string) {
    jobId = id
    stopPolling()
    error.value = null

    try {
      const job = await api.getJob(id)
      if (jobId !== id) return

      activeJob.value = job
      if (!isDone(job)) startPolling(id)
    } catch (e) {
      if (jobId !== id) return

      activeJob.value = null
      error.value = toErrorMessage(e)
    }
  }

  function clearActiveJob() {
    jobId = null
    stopPolling()
    activeJob.value = null
  }

  async function cancelJob(id: string) {
    error.value = null
    try {
      await api.cancelJob(id)
      await Promise.all([loadJob(id), fetchJobs()])
    } catch (e) {
      error.value = toErrorMessage(e)
    }
  }

  function startPolling(id: string) {
    pollTimer = setInterval(async () => {
      const job = await api.getJob(id)
      if (jobId !== id) return

      activeJob.value = job

      if (isDone(job)) {
        stopPolling()
        await fetchJobs()
      }
    }, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    jobs,
    activeJob,
    isActiveJobDone,
    loading,
    error,
    fetchJobs,
    createJob,
    loadJob,
    clearActiveJob,
    cancelJob,
  }
})
