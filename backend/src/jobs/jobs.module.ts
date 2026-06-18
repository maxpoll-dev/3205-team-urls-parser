import { Module } from '@nestjs/common'
import { JobsController } from './jobs.controller'
import { JobsService } from './jobs.service'
import { JobsRepository } from './jobs.repository'
import { JobsProcessor } from './jobs.processor'

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsRepository, JobsProcessor]
})
export class JobsModule {}
