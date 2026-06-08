import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Mission } from './interfaces/mission.interface';

@Injectable()
export class MissionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(orgId: string): Promise<Mission[]> {
    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }
    const res = await this.db.query<Mission>(
      'SELECT id, organization_id, title, points, status FROM missions WHERE organization_id = $1 ORDER BY id ASC',
      [orgId],
    );
    return res.rows;
  }

  async submit(orgId: string, id: string): Promise<Mission> {
    if (!orgId) {
      throw new BadRequestException('Organization ID is required');
    }
    if (!id) {
      throw new BadRequestException('Mission ID is required');
    }

    // Retrieve the mission by ID to check existence and organization ownership
    const findRes = await this.db.query<Mission>(
      'SELECT id, organization_id, title, points, status FROM missions WHERE id = $1',
      [id],
    );

    if (findRes.rows.length === 0) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    const mission = findRes.rows[0];

    // Tenant Isolation Guard: Verify the mission belongs to the calling organization
    if (mission.organization_id !== orgId) {
      throw new ForbiddenException('Access denied: Mission belongs to a different organization');
    }

    // Update the mission status to SUBMITTED
    const updateRes = await this.db.query<Mission>(
      'UPDATE missions SET status = $1 WHERE id = $2 RETURNING id, organization_id, title, points, status',
      ['SUBMITTED', id],
    );

    return updateRes.rows[0];
  }
}
