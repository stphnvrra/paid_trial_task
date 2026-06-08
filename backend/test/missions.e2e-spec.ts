import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '../src/database/database.service';

describe('MissionsController (e2e) - Tenant Isolation', () => {
  let app: INestApplication<App>;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dbService = app.get(DatabaseService);
  });

  beforeEach(async () => {
    // Reset database to a clean seed state before each test
    await dbService.query('DROP TABLE IF EXISTS missions;');
    await dbService.query(`
      CREATE TABLE missions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        organization_id TEXT NOT NULL,
        title TEXT NOT NULL,
        points INTEGER NOT NULL,
        status TEXT NOT NULL
      );
    `);
    await dbService.query('CREATE INDEX idx_missions_organization_id ON missions(organization_id);');
    await dbService.query(`
      INSERT INTO missions (organization_id, title, points, status) VALUES
      ('org-a', 'Complete Security Quiz', 100, 'AVAILABLE'),
      ('org-a', 'Setup MFA', 150, 'AVAILABLE'),
      ('org-b', 'Review ESG Standards', 200, 'AVAILABLE'),
      ('org-b', 'Report Workplace Safety Issue', 120, 'AVAILABLE');
    `);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /missions', () => {
    it('should reject requests without x-org-id header', async () => {
      const res = await request(app.getHttpServer())
        .get('/missions')
        .expect(400);

      expect(res.body.message).toContain('Missing x-org-id header');
    });

    it('should return missions only belonging to org-a', async () => {
      const res = await request(app.getHttpServer())
        .get('/missions')
        .set('x-org-id', 'org-a')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      res.body.forEach((mission: any) => {
        expect(mission.organization_id).toBe('org-a');
      });
    });

    it('should return missions only belonging to org-b', async () => {
      const res = await request(app.getHttpServer())
        .get('/missions')
        .set('x-org-id', 'org-b')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      res.body.forEach((mission: any) => {
        expect(mission.organization_id).toBe('org-b');
      });
    });
  });

  describe('POST /missions/:id/submit', () => {
    it('should reject requests without x-org-id header', async () => {
      // Find an org-a mission
      const listRes = await dbService.query('SELECT id FROM missions WHERE organization_id = $1 LIMIT 1', ['org-a']);
      const missionId = listRes.rows[0].id;

      const res = await request(app.getHttpServer())
        .post(`/missions/${missionId}/submit`)
        .expect(400);

      expect(res.body.message).toContain('Missing x-org-id header');
    });

    it('should allow submitting a mission belonging to the calling organization', async () => {
      const listRes = await dbService.query("SELECT id FROM missions WHERE organization_id = 'org-a' AND status = 'AVAILABLE' LIMIT 1");
      const missionId = listRes.rows[0].id;

      const res = await request(app.getHttpServer())
        .post(`/missions/${missionId}/submit`)
        .set('x-org-id', 'org-a')
        .expect(201); // default NestJS POST status code is 201

      expect(res.body.id).toBe(missionId.toString());
      expect(res.body.status).toBe('SUBMITTED');

      // Verify DB status update
      const dbVerify = await dbService.query('SELECT status FROM missions WHERE id = $1', [missionId]);
      expect(dbVerify.rows[0].status).toBe('SUBMITTED');
    });

    it('should reject submission if the mission belongs to a different organization (Tenant Isolation)', async () => {
      // Find a mission belonging to org-b
      const listRes = await dbService.query("SELECT id FROM missions WHERE organization_id = 'org-b' LIMIT 1");
      const missionId = listRes.rows[0].id;

      // Try to submit as org-a
      const res = await request(app.getHttpServer())
        .post(`/missions/${missionId}/submit`)
        .set('x-org-id', 'org-a')
        .expect(403); // Forbidden

      expect(res.body.message).toContain('Access denied: Mission belongs to a different organization');

      // Verify status remains AVAILABLE in database
      const dbVerify = await dbService.query('SELECT status FROM missions WHERE id = $1', [missionId]);
      expect(dbVerify.rows[0].status).toBe('AVAILABLE');
    });

    it('should return 404 if the mission does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/missions/999999/submit')
        .set('x-org-id', 'org-a')
        .expect(404);

      expect(res.body.message).toContain('Mission with ID 999999 not found');
    });
  });
});
