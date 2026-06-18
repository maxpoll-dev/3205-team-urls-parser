import { IsArray, ArrayNotEmpty, IsUrl } from "class-validator"

export class CreateJobsBodyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  urls: string[]
}