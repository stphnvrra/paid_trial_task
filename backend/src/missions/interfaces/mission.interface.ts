export interface Mission {
  id: string; // BIGINT is represented as string in node-postgres
  organization_id: string;
  title: string;
  points: number;
  status: string;
}
