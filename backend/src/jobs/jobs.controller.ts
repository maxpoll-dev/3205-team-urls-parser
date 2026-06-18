import { Controller, Get, Post, Delete, Param, Body, HttpStatus, HttpCode } from '@nestjs/common'
import { JobsService } from './jobs.service'
import { CreateJobsBodyDto } from "./dto/create-jobs.body.dto"

// Тут можно поставить рейт лимит на путь /jobs
// @Throttle({ default: { limit: 60, ttl: 60000 } })
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  // Изначально хотел реализовать пагинацию limit / page,
  // но в процессе передумал так как тз явно не просит и ревьюера может запутать.
  @Get()
  getList() {
    return this.service.getList()
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Post()
  create(@Body() dto: CreateJobsBodyDto) {
    return this.service.create(dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelById(@Param('id') id: string) {
    return this.service.cancelById(id)
  }
}