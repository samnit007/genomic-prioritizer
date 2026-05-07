import client from './client';
import type { Priority, VariantNote, AuditEntry } from '@/types';

export const variantsApi = {
  setPriority: (id: string, priority: Priority, teamId?: string) =>
    client.put(`/variants/${id}/priority`, { priority, teamId }),

  getNotes: (id: string) => client.get<VariantNote[]>(`/variants/${id}/notes`),

  addNote: (id: string, noteText: string, teamId?: string) =>
    client.post<VariantNote>(`/variants/${id}/notes`, { noteText, teamId }),

  getAudit: (id: string) => client.get<AuditEntry[]>(`/variants/${id}/audit`),
};
