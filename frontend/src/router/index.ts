import { createRouter, createWebHistory } from 'vue-router'
import JobsListView from '../views/JobsListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/jobs',
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: JobsListView,
    },
    {
      path: '/jobs/create',
      name: 'create',
      component: () => import('../views/JobCreateView.vue'),
    },
    {
      path: '/jobs/:id',
      name: 'job',
      component: () => import('../views/JobDetailView.vue'),
    },
  ],
})

export default router
