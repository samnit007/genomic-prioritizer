<template>
  <div class="bg-slate-100 rounded-lg px-3 py-2">
    <div v-if="loading" class="text-xs text-slate-400">Loading audit…</div>
    <div v-else-if="!entries.length" class="text-xs text-slate-400 italic">No audit history.</div>
    <div v-else class="space-y-1">
      <div
        v-for="e in entries"
        :key="e.id"
        class="flex items-center gap-2 text-xs"
      >
        <span class="text-slate-500 shrink-0">{{ formatDate(e.changedAt) }}</span>
        <span class="font-medium text-slate-700 shrink-0">{{ e.user.name }}</span>
        <span class="text-slate-400">changed priority</span>
        <span v-if="e.oldPriority" :class="priorityColor(e.oldPriority)" class="font-semibold">{{ e.oldPriority }}</span>
        <span v-if="e.oldPriority" class="text-slate-400">→</span>
        <span :class="priorityColor(e.newPriority)" class="font-semibold">{{ e.newPriority }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { variantsApi } from '@/api/variants';
import type { AuditEntry, Priority } from '@/types';

const props = defineProps<{ variantId: string }>();

const entries = ref<AuditEntry[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await variantsApi.getAudit(props.variantId);
    entries.value = data;
  } finally {
    loading.value = false;
  }
});

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function priorityColor(p: Priority) {
  if (p === 'IMPORTANT') return 'text-red-600';
  if (p === 'LOW') return 'text-amber-600';
  return 'text-slate-500';
}
</script>
