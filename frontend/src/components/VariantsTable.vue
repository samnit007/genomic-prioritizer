<template>
  <div class="space-y-2">
    <div
      v-for="v in variants"
      :key="v.id"
      class="border border-slate-200 rounded-lg overflow-hidden"
    >
      <!-- Variant summary row -->
      <div
        class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        @click="toggle(v.id)"
      >
        <!-- Priority badge -->
        <span
          class="w-20 shrink-0 text-center"
          :class="priorityBadgeClass(currentPriority(v))"
        >
          {{ currentPriority(v) ?? 'Unset' }}
        </span>

        <!-- Gene + position -->
        <div class="w-24 shrink-0">
          <div class="font-semibold text-slate-800 text-sm">{{ v.geneName }}</div>
          <div class="text-xs text-slate-400 font-mono">Chr{{ v.chromosome }}</div>
        </div>

        <!-- Position + allele -->
        <div class="w-36 shrink-0 text-xs font-mono text-slate-600">
          <div>{{ v.position.toLocaleString() }}</div>
          <div>{{ v.refAllele }} → {{ v.altAllele }}</div>
        </div>

        <!-- Consequence -->
        <div class="flex-1 min-w-0">
          <div class="text-xs text-slate-600 truncate">{{ v.consequence.replace(/_/g, ' ') }}</div>
          <div class="text-xs text-slate-400">{{ v.proteinChange ?? v.hgvsC ?? '' }}</div>
        </div>

        <!-- Clinical significance -->
        <span :class="sigBadgeClass(v.clinicalSignificance)" class="shrink-0">
          {{ sigLabel(v.clinicalSignificance) }}
        </span>

        <!-- CADD -->
        <div class="w-16 shrink-0 text-right">
          <span
            class="text-xs font-semibold"
            :class="v.caddScore && v.caddScore >= 30 ? 'text-red-600' : v.caddScore && v.caddScore >= 20 ? 'text-amber-600' : 'text-slate-500'"
          >
            {{ v.caddScore?.toFixed(1) ?? '—' }}
          </span>
          <div class="text-xs text-slate-400">CADD</div>
        </div>

        <!-- Notes count -->
        <div class="w-8 shrink-0 text-center">
          <span v-if="v.notes.length" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {{ v.notes.length }}
          </span>
        </div>

        <!-- Expand arrow -->
        <svg class="w-4 h-4 text-slate-400 shrink-0 transition-transform" :class="{ 'rotate-90': expanded.has(v.id) }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>

      <!-- Expanded detail -->
      <div v-if="expanded.has(v.id)" class="border-t border-slate-100 bg-slate-50">
        <!-- Full variant details -->
        <div class="px-4 py-3 grid grid-cols-4 gap-x-6 gap-y-2 text-xs border-b border-slate-100">
          <div><span class="text-slate-400">Variant Type</span><div class="font-medium">{{ v.variantType }}</div></div>
          <div><span class="text-slate-400">Zygosity</span><div class="font-medium">{{ v.zygosity }}</div></div>
          <div><span class="text-slate-400">rsID</span><div class="font-mono">{{ v.rsId ?? '—' }}</div></div>
          <div><span class="text-slate-400">hgvs.c</span><div class="font-mono">{{ v.hgvsC ?? '—' }}</div></div>
          <div><span class="text-slate-400">gnomAD AF</span><div class="font-mono">{{ v.gnomadAf?.toExponential(2) ?? '—' }}</div></div>
          <div><span class="text-slate-400">Allele Freq</span><div class="font-mono">{{ v.alleleFrequency?.toExponential(2) ?? '—' }}</div></div>
          <div><span class="text-slate-400">SIFT</span><div :class="v.siftPrediction === 'deleterious' ? 'text-red-600 font-medium' : ''">{{ v.siftPrediction ?? '—' }}</div></div>
          <div><span class="text-slate-400">PolyPhen</span><div :class="v.polyphenPrediction === 'probably_damaging' ? 'text-red-600 font-medium' : v.polyphenPrediction === 'possibly_damaging' ? 'text-amber-600 font-medium' : ''">{{ v.polyphenPrediction ?? '—' }}</div></div>
          <div v-if="v.study"><span class="text-slate-400">Study</span><div>{{ v.study.studyName }}</div></div>
        </div>

        <!-- Priority actions -->
        <div class="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
          <span class="text-xs text-slate-500 mr-1 font-medium">Set Priority:</span>
          <button
            v-for="p in priorities"
            :key="p.value"
            @click="setPriority(v, p.value)"
            :disabled="!canEdit || savingPriority === v.id"
            class="text-xs px-3 py-1 rounded-full border font-medium transition-colors disabled:opacity-40"
            :class="currentPriority(v) === p.value ? p.activeClass : p.inactiveClass"
          >
            {{ p.label }}
          </button>
          <span v-if="savingPriority === v.id" class="text-xs text-slate-400 ml-2">Saving…</span>
          <span v-if="!canEdit" class="text-xs text-slate-400 ml-2 italic">Viewer — read only</span>
        </div>

        <!-- Notes -->
        <VariantNotes :variant="v" :patient-id="patientId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { variantsApi } from '@/api/variants';
import { usePatientsStore } from '@/stores/patients';
import { useAuthStore } from '@/stores/auth';
import VariantNotes from './VariantNotes.vue';
import type { Variant, Priority } from '@/types';

const props = defineProps<{ variants: Variant[]; patientId: string }>();

const store = usePatientsStore();
const auth = useAuthStore();

const expanded = ref<Set<string>>(new Set());
const savingPriority = ref<string | null>(null);
const canEdit = ref(auth.canEdit);

const priorities = [
  { value: 'IMPORTANT' as Priority, label: 'Important', activeClass: 'border-red-400 bg-red-100 text-red-700', inactiveClass: 'border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-600' },
  { value: 'LOW' as Priority, label: 'Low Priority', activeClass: 'border-amber-400 bg-amber-100 text-amber-700', inactiveClass: 'border-slate-300 text-slate-600 hover:border-amber-300 hover:text-amber-600' },
  { value: 'AVOID' as Priority, label: 'Avoid', activeClass: 'border-slate-400 bg-slate-200 text-slate-600', inactiveClass: 'border-slate-300 text-slate-600 hover:border-slate-400' },
];

function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}

function currentPriority(v: Variant) {
  return v.priorities[0]?.priority ?? null;
}

async function setPriority(v: Variant, priority: Priority) {
  if (!auth.activeTeamId) return;
  savingPriority.value = v.id;
  try {
    await variantsApi.setPriority(v.id, priority, auth.activeTeamId);
    store.updateVariantPriority(props.patientId, v.id, priority, auth.activeTeamId, auth.user?.name ?? '');
  } finally {
    savingPriority.value = null;
  }
}

function priorityBadgeClass(p: string | null) {
  if (p === 'IMPORTANT') return 'badge badge-important';
  if (p === 'LOW') return 'badge badge-low';
  if (p === 'AVOID') return 'badge badge-avoid';
  return 'badge bg-slate-100 text-slate-400';
}

function sigBadgeClass(sig: string) {
  const map: Record<string, string> = {
    PATHOGENIC: 'badge badge-pathogenic',
    LIKELY_PATHOGENIC: 'badge badge-likely_pathogenic',
    VUS: 'badge badge-vus',
    LIKELY_BENIGN: 'badge badge-likely_benign',
    BENIGN: 'badge badge-benign',
  };
  return map[sig] ?? 'badge bg-slate-100 text-slate-500';
}

function sigLabel(sig: string) {
  const map: Record<string, string> = {
    PATHOGENIC: 'Pathogenic',
    LIKELY_PATHOGENIC: 'Likely Path.',
    VUS: 'VUS',
    LIKELY_BENIGN: 'Likely Benign',
    BENIGN: 'Benign',
  };
  return map[sig] ?? sig;
}
</script>
