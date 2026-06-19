<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <el-text class="header__title">Urls checker</el-text>

        <RouterLink to="/jobs/create">
          <el-button type="primary">Create</el-button>
        </RouterLink>
      </el-header>

      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;

  &__title {
    font-family: sans-serif;
    font-size: 24px;
    text-transform: uppercase;
  }
}
</style>
