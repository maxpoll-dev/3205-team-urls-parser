import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { JobsModule } from './jobs/jobs.module'

@Module({
  imports: [
    // Core
    HealthModule,

    // Domains
    JobsModule
  ]
})
export class AppModule {}
