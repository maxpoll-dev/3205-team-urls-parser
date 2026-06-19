<template>
  <el-form @submit.prevent="submit">
    <el-form-item>
      <el-input
        v-model="raw"
        type="textarea"
        :rows="6"
        placeholder="https://example.com&#10;https://..."
      />
    </el-form-item>

    <el-alert v-if="store.error" :title="store.error" type="error" :closable="false" show-icon />

    <el-form-item>
      <el-button type="primary" native-type="submit" :loading="store.loading"> Submit </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useJobsStore } from '@/stores/jobs'

const router = useRouter()
const store = useJobsStore()
const raw = ref('')

async function submit() {
  const urls = raw.value
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean)

  if (!urls.length) return

  const jobId = await store.createJob(urls)
  if (jobId) {
    raw.value = ''
    router.push(`/jobs/${jobId}`)
  }
}
</script>
