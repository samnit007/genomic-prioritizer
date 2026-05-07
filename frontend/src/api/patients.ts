import client from './client';
import type { Patient, Study, Variant } from '@/types';

export const patientsApi = {
  list: (params?: { teamId?: string; search?: string }) =>
    client.get<Patient[]>('/patients', { params }),

  get: (id: string) => client.get<Patient>(`/patients/${id}`),

  studies: (id: string) => client.get<Study[]>(`/patients/${id}/studies`),

  variants: (id: string, params?: { gene?: string; chromosome?: string; teamId?: string }) =>
    client.get<Variant[]>(`/patients/${id}/variants`, { params }),
};
