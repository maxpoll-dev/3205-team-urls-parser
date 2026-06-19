<template>
  <section v-if="store.activeJob">
    <div class="header">
      <h2>{{ store.activeJob.id }}</h2>

      <el-tag :type="jobStatusTagType(store.activeJob.status)">{{ store.activeJob.status }}</el-tag>
      <el-button
        v-if="!store.isActiveJobDone"
        type="danger"
        @click="store.cancelJob(store.activeJob.id)"
        >Cancel</el-button
      >
    </div>

    <el-progress :percentage="progress" />

    <p>
      Done &nbsp;{{ store.activeJob.stats.success + store.activeJob.stats.error }}
      &nbsp;of&nbsp;
      {{ store.activeJob.stats.total }}
    </p>

    <el-table :data="store.activeJob.urls">
      <el-table-column type="index" label="#" width="40" />

      <el-table-column prop="url" label="URL" />

      <el-table-column label="Status">
        <template #default="{ row }">
          <el-tag :type="urlStatusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Code">
        <template #default="{ row }">{{ row.httpStatus ?? '—' }}</template>
      </el-table-column>

      <el-table-column label="Start / End">
        <template #default="{ row }">
          {{ formatTime(row.startedAt) }} / {{ formatTime(row.finishedAt) }}
        </template>
      </el-table-column>

      <el-table-column label="Duration">
        <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
      </el-table-column>

      <el-table-column label="Error">
        <template #default="{ row }">{{ row.error ?? '—' }}</template>
      </el-table-column>
    </el-table>
  </section>

  <el-empty v-else-if="store.error" :description="store.error" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useJobsStore } from '@/stores/jobs'
import { jobStatusTagType, urlStatusTagType } from '@/utils/status'
import { formatTime, formatDuration } from '@/utils/format'

const store = useJobsStore()

const progress = computed(() => {
  const job = store.activeJob
  if (!job || !job.stats.total) return 0

  const done = job.stats.success + job.stats.error + job.stats.cancelled
  return Math.round((done / job.stats.total) * 100)
})
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 0 auto 0 0;
  }
}

.el-progress {
  margin-bottom: 8px;
}

.el-table {
  margin-top: 16px;
}
</style>
