import { defineStore } from 'pinia';
import { ref } from 'vue';
import { patientsApi } from '@/api/patients';
import type { Patient, Study, Variant } from '@/types';

export const usePatientsStore = defineStore('patients', () => {
  const patients = ref<Patient[]>([]);
  const loading = ref(false);
  const studies = ref<Record<string, Study[]>>({});
  const variants = ref<Record<string, Variant[]>>({});
  const loadingVariants = ref<Record<string, boolean>>({});

  async function fetchPatients(params?: { teamId?: string; search?: string }) {
    loading.value = true;
    try {
      const { data } = await patientsApi.list(params);
      patients.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStudies(patientId: string) {
    const { data } = await patientsApi.studies(patientId);
    studies.value[patientId] = data;
  }

  async function fetchVariants(patientId: string, params?: { gene?: string; chromosome?: string; teamId?: string }) {
    loadingVariants.value[patientId] = true;
    try {
      const { data } = await patientsApi.variants(patientId, params);
      variants.value[patientId] = data;
    } finally {
      loadingVariants.value[patientId] = false;
    }
  }

  function updateVariantPriority(patientId: string, variantId: string, priority: string, teamId: string, userName: string) {
    const list = variants.value[patientId];
    if (!list) return;
    const v = list.find(x => x.id === variantId);
    if (!v) return;
    const existing = v.priorities.find(p => p.team?.id === teamId || true);
    if (existing) {
      existing.priority = priority as any;
      existing.updatedAt = new Date().toISOString();
      existing.setByUser = { name: userName };
    } else {
      v.priorities.push({ id: '', priority: priority as any, updatedAt: new Date().toISOString(), setByUser: { name: userName }, team: { name: '' } });
    }
  }

  function addVariantNote(patientId: string, variantId: string, note: any) {
    const list = variants.value[patientId];
    if (!list) return;
    const v = list.find(x => x.id === variantId);
    if (v) v.notes.unshift(note);
  }

  return { patients, loading, studies, variants, loadingVariants, fetchPatients, fetchStudies, fetchVariants, updateVariantPriority, addVariantNote };
});
