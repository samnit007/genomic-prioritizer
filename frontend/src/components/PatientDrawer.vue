<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-40 flex">
    <div class="flex-1 bg-black/30" @click="$emit('close')" />

    <!-- Drawer panel -->
    <div class="w-full max-w-4xl bg-white shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-clinical-900 text-white px-6 py-4 flex items-start justify-between shrink-0">
        <div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-clinical-300 text-sm">{{ patient.patientCode }}</span>
            <span class="text-white font-semibold">{{ patient.firstName }} {{ patient.lastName }}</span>
          </div>
          <div class="flex gap-4 mt-1 text-xs text-clinical-300">
            <span>{{ patient.diagnosis }}</span>
            <span>·</span>
            <span>{{ patient.gender }}</span>
            <span>·</span>
            <span>DOB: {{ formatDate(patient.dateOfBirth) }}</span>
            <span>·</span>
            <span>{{ patient.ethnicity }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button @click="downloadPdf(`/api/pdf/patient/${patient.id}`, `${patient.patientCode}.pdf`)" class="btn-secondary text-xs">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            PDF
          </button>
          <button @click="$emit('close')" class="text-clinical-300 hover:text-white p-1 rounded">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-slate-200 px-6 flex gap-0 shrink-0 bg-white">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.id
            ? 'border-clinical-700 text-clinical-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Studies tab -->
        <div v-if="activeTab === 'studies'" class="p-6">
          <div v-if="loadingStudies" class="text-center py-10 text-slate-400 text-sm">Loading studies…</div>
          <div v-else-if="!studies.length" class="text-center py-10 text-slate-400 text-sm">No studies found</div>
          <div v-else class="space-y-3">
            <div
              v-for="s in studies"
              :key="s.id"
              class="border border-slate-200 rounded-lg p-4"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium text-slate-800 text-sm">{{ s.studyName }}</div>
                  <div class="flex gap-3 mt-1 text-xs text-slate-500">
                    <span class="badge bg-clinical-100 text-clinical-700">{{ s.studyType }}</span>
                    <span>{{ s.sequencingPlatform }}</span>
                    <span>{{ formatDate(s.dateConducted) }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : s.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ s.status.replace('_', ' ') }}
                  </span>
                  <span class="text-xs text-slate-400">{{ s._count?.variants ?? 0 }} variants</span>
                </div>
              </div>
              <p v-if="s.notes" class="mt-2 text-xs text-slate-500 italic">{{ s.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Variants tab -->
        <div v-if="activeTab === 'variants'" class="p-6">
          <!-- Filters -->
          <div class="flex gap-2 mb-4">
            <input
              v-model="geneFilter"
              @input="debouncedVariantFetch"
              type="text"
              placeholder="Filter by gene…"
              class="text-sm rounded-lg border-slate-300 focus:ring-clinical-600 px-3 py-1.5 w-40"
            />
            <input
              v-model="chrFilter"
              @input="debouncedVariantFetch"
              type="text"
              placeholder="Chromosome…"
              class="text-sm rounded-lg border-slate-300 focus:ring-clinical-600 px-3 py-1.5 w-32"
            />
            <button @click="clearFilters" class="btn-secondary text-xs">Clear</button>
            <span class="ml-auto text-xs text-slate-400 self-center">{{ variants.length }} variant(s)</span>
          </div>

          <div v-if="loadingVariants" class="text-center py-10 text-slate-400 text-sm">Loading variants…</div>
          <div v-else-if="!variants.length" class="text-center py-10 text-slate-400 text-sm">No variants found</div>
          <VariantsTable v-else :variants="variants" :patient-id="patient.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePatientsStore } from '@/stores/patients';
import { useAuthStore } from '@/stores/auth';
import VariantsTable from './VariantsTable.vue';
import type { Patient } from '@/types';

const props = defineProps<{ patient: Patient }>();
defineEmits<{ close: [] }>();

const store = usePatientsStore();
const auth = useAuthStore();

const activeTab = ref<'studies' | 'variants'>('studies');
const geneFilter = ref('');
const chrFilter = ref('');
const loadingStudies = ref(false);
const loadingVariants = ref(false);

const studies = computed(() => store.studies[props.patient.id] ?? []);
const variants = computed(() => store.variants[props.patient.id] ?? []);

const tabs = computed(() => [
  { id: 'studies' as const, label: 'Studies', count: studies.value.length },
  { id: 'variants' as const, label: 'Variants', count: variants.value.length },
]);

let debounceTimer: ReturnType<typeof setTimeout>;
function debouncedVariantFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchVariants, 300);
}

async function fetchStudies() {
  loadingStudies.value = true;
  await store.fetchStudies(props.patient.id);
  loadingStudies.value = false;
}

async function fetchVariants() {
  loadingVariants.value = true;
  await store.fetchVariants(props.patient.id, {
    gene: geneFilter.value || undefined,
    chromosome: chrFilter.value || undefined,
    teamId: auth.activeTeamId ?? undefined,
  });
  loadingVariants.value = false;
}

function clearFilters() {
  geneFilter.value = '';
  chrFilter.value = '';
  fetchVariants();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function downloadPdf(url: string, filename: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return;
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

watch(() => activeTab.value, (tab) => {
  if (tab === 'variants' && !variants.value.length) fetchVariants();
});

onMounted(() => {
  fetchStudies();
});
</script>
