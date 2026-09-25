import http from './api';

export interface FieldTeam {
  id: string;
  name: string;
  leader_name: string | null;
  district: string | null;
  team_size: number;
  status: string;
  specialization: string;
}

export function listFieldTeams(status?: string) {
  return http.get<FieldTeam[]>('/field-teams/', status ? { status } : undefined);
}
