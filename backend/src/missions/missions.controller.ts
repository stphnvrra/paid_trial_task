import { Controller, Get, Post, Param, Headers, BadRequestException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { Mission } from './interfaces/mission.interface';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  async findAll(@Headers('x-org-id') orgId?: string): Promise<Mission[]> {
    if (!orgId) {
      throw new BadRequestException('Missing x-org-id header');
    }
    return this.missionsService.findAll(orgId);
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Headers('x-org-id') orgId?: string,
  ): Promise<Mission> {
    if (!orgId) {
      throw new BadRequestException('Missing x-org-id header');
    }
    return this.missionsService.submit(orgId, id);
  }
}
