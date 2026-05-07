<template>
  <div class="px-4 py-3">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</span>
      <button
        v-if="!showAudit"
        @click="showAudit = true"
        class="text-xs text-slate-400 hover:text-slate-600"
      >
        View audit log →
      </button>
      <button v-else @click="showAudit = false" class="text-xs text-slate-400 hover:text-slate-600">
        Hide audit
      </button>
    </div>

    <!-- Audit log -->
    <div v-if="showAudit" class="mb-3">
      <AuditLog :variant-id="variant.id" />
    </div>

    <!-- Existing notes -->
    <div v-if="variant.notes.length" class="space-y-2 mb-3">
      <div
        v-for="note in variant.notes"
        :key="note.id"
        class="bg-white border border-slate-200 rounded-lg px-3 py-2"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-semibold text-slate-700">{{ note.user.name }}</span>
          <span class="text-xs text-slate-400">{{ formatDate(note.createdAt) }}</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">{{ note.noteText }}</p>
      </div>
    </div>
    <div v-else-if="!showAddNote" class="text-xs text-slate-400 italic mb-2">No notes yet.</div>

    <!-- Add note -->
    <div v-if="canEdit">
      <div v-if="showAddNote" class="space-y-2">
        <textarea
          v-model="noteText"
          rows="3"
          placeholder="Add a clinical note…"
          class="w-full text-xs rounded-lg border-slate-300 focus:ring-clinical-600 resize-none"
        />
        <div class="flex gap-2">
          <button @click="submitNote" :disabled="!noteText.trim() || saving" class="btn-primary text-xs">
            {{ saving ? 'Saving…' : 'Save note' }}
          </button>
          <button @click="cancelNote" class="btn-secondary text-xs">Cancel</button>
        </div>
      </div>
      <button v-else @click="showAddNote = true" class="text-xs text-clinical-600 hover:text-clinical-800 font-medium">
        + Add note
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { variantsApi } from '@/api/variants';
import { usePatientsStore } from '@/stores/patients';
import { useAuthStore } from '@/stores/auth';
import AuditLog from './AuditLog.vue';
import type { Variant } from '@/types';

const props = defineProps<{ variant: Variant; patientId: string }>();

const store = usePatientsStore();
const auth = useAuthStore();

const noteText = ref('');
const showAddNote = ref(false);
const showAudit = ref(false);
const saving = ref(false);
const canEdit = computed(() => auth.canEdit);

async function submitNote() {
  if (!noteText.value.trim()) return;
  saving.value = true;
  try {
    const { data } = await variantsApi.addNote(props.variant.id, noteText.value.trim(), auth.activeTeamId ?? undefined);
    store.addVariantNote(props.patientId, props.variant.id, data);
    noteText.value = '';
    showAddNote.value = false;
  } finally {
    saving.value = false;
  }
}

function cancelNote() {
  noteText.value = '';
  showAddNote.value = false;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
