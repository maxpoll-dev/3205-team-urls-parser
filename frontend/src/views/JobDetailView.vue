<template>
  <el-container direction="vertical">
    <NavReturn />
    <JobDetails />
  </el-container>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useJobsStore } from '@/stores/jobs'
import JobDetails from '@/components/JobDetails.vue'
import NavReturn from '@/components/NavReturn.vue'

const route = useRoute()
const store = useJobsStore()

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') store.loadJob(id)
  },
  { immediate: true },
)

onBeforeUnmount(() => store.clearActiveJob())
</script>
