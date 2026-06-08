-- Drop table if exists
DROP TABLE IF EXISTS missions;

-- Create table
CREATE TABLE missions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  points INTEGER NOT NULL,
  status TEXT NOT NULL
);

-- Index for tenant isolation
CREATE INDEX idx_missions_organization_id ON missions(organization_id);

-- Seed data
INSERT INTO missions (organization_id, title, points, status) VALUES
('org-a', 'Complete Security Quiz', 100, 'AVAILABLE'),
('org-a', 'Setup MFA', 150, 'AVAILABLE'),
('org-b', 'Review ESG Standards', 200, 'AVAILABLE'),
('org-b', 'Report Workplace Safety Issue', 120, 'AVAILABLE');
