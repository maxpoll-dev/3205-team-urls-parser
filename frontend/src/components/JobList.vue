<template>
  <el-table :data="sortedJobs" @row-click="open">
    <el-table-column type="index" label="#" width="40" />

    <el-table-column prop="id" label="ID" />

    <el-table-column label="Created">
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </el-table-column>

    <el-table-column label="Status">
      <template #default="{ row }">
        <el-tag :type="jobStatusTagType(row.status)">{{ row.status }}</el-tag>
      </template>
    </el-table-column>

    <el-table-column label="Result">
      <template #default="{ row }">
        <template v-if="DONE_STATUSES.includes(row.status)">
          <el-text type="success">{{ row.stats.success }}</el-text>
          &nbsp;/&nbsp;
          <el-text type="danger">{{ row.stats.error }}</el-text>
          &nbsp;of&nbsp;
          {{ row.stats.total }}
        </template>

        <el-icon v-else class="is-loading"><Loading /></el-icon>
      </template>
    </el-table-column>

    <el-table-column label="Success rate">
      <template #default="{ row }">
        <el-text v-if="DONE_STATUSES.includes(row.status)" type="success">
          {{ row.stats.successRate }}%
        </el-text>

        <el-icon v-else class="is-loading"><Loading /></el-icon>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJobsStore } from '@/stores/jobs'
import { DONE_STATUSES, type JobListItem } from '@/types/job'
import { jobStatusTagType } from '@/utils/status'
import { formatDateTime } from '@/utils/format'
import { Loading } from '@element-plus/icons-vue'

const router = useRouter()
const store = useJobsStore()

const sortedJobs = computed(() =>
  [...store.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

function open(job: JobListItem) {
  router.push(`/jobs/${job.id}`)
}

onMounted(() => store.fetchJobs())
</script>
