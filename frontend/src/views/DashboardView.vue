<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Topbar -->
    <header class="bg-clinical-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-clinical-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
        <span class="font-semibold tracking-wide text-sm">GenomePrioritizer</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Team selector -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-clinical-400">Team:</span>
          <select
            :value="auth.activeTeamId"
            @change="auth.setActiveTeam(($event.target as HTMLSelectElement).value)"
            class="text-xs bg-clinical-800 border-clinical-700 text-white rounded px-2 py-1 focus:ring-clinical-500"
          >
            <option v-for="t in auth.user?.teams" :key="t.id" :value="t.id">
              {{ t.name }} ({{ t.role }})
            </option>
          </select>
        </div>

        <!-- PDF all -->
        <button @click="downloadPdf('/api/pdf/all', 'variants-all.pdf')" class="btn-secondary text-xs">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export All PDF
        </button>

        <div class="flex items-center gap-2">
          <span class="text-xs text-clinical-300">{{ auth.user?.name }}</span>
          <button @click="handleLogout" class="text-xs text-clinical-400 hover:text-white transition-colors">Logout</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
      <!-- Filters -->
      <div class="flex items-center gap-3 mb-4">
        <div class="relative flex-1 max-w-sm">
          <svg class="absolute left-2.5 top-2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="search"
            @input="debouncedFetch"
            type="text"
            placeholder="Search patient code or name…"
            class="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border-slate-300 focus:ring-clinical-600 focus:border-clinical-600"
          />
        </div>
        <select
          v-model="filterTeamId"
          @change="fetchData"
          class="text-sm rounded-lg border-slate-300 focus:ring-clinical-600 py-1.5"
        >
          <option value="">All teams</option>
          <option v-for="t in auth.user?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <span class="text-xs text-slate-400 ml-auto">{{ store.patients.length }} patient(s)</span>
      </div>

      <!-- Patient table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner Team</th>
              <th class="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Studies</th>
              <th class="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Variants</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="store.loading">
              <td colspan="7" class="text-center py-10 text-slate-400 text-sm">Loading…</td>
            </tr>
            <tr v-else-if="!store.patients.length">
              <td colspan="7" class="text-center py-10 text-slate-400 text-sm">No patients found</td>
            </tr>
            <tr
              v-for="p in store.patients"
              :key="p.id"
              @click="openPatient(p)"
              class="hover:bg-slate-50 cursor-pointer transition-colors"
              :class="{ 'bg-clinical-50': selectedPatient?.id === p.id }"
            >
              <td class="px-4 py-3 font-mono text-xs font-semibold text-clinical-700">{{ p.patientCode }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-slate-800">{{ p.firstName }} {{ p.lastName }}</div>
                <div class="text-xs text-slate-400">{{ p.gender }} · {{ p.ethnicity }}</div>
              </td>
              <td class="px-4 py-3 text-slate-600 text-xs">{{ p.diagnosis }}</td>
              <td class="px-4 py-3 text-xs text-slate-500">{{ p.ownerTeam.name }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-clinical-100 text-clinical-700 text-xs font-semibold">
                  {{ p._count.studies }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {{ p._count.variants }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <svg class="w-4 h-4 text-slate-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Patient drawer -->
    <PatientDrawer
      v-if="selectedPatient"
      :patient="selectedPatient"
      @close="selectedPatient = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { usePatientsStore } from '@/stores/patients';
import PatientDrawer from '@/components/PatientDrawer.vue';
import type { Patient } from '@/types';

const router = useRouter();
const auth = useAuthStore();
const store = usePatientsStore();

const search = ref('');
const filterTeamId = ref('');
const selectedPatient = ref<Patient | null>(null);

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

let debounceTimer: ReturnType<typeof setTimeout>;

function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchData, 300);
}

async function fetchData() {
  await store.fetchPatients({
    teamId: filterTeamId.value || undefined,
    search: search.value || undefined,
  });
}

function openPatient(p: Patient) {
  selectedPatient.value = p;
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}

onMounted(fetchData);
</script>
