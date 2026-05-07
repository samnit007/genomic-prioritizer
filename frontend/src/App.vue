<template>
  <div v-if="crashed" class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-slate-500 text-sm mt-2">Something went wrong. Please refresh the page.</p>
      <button @click="reload" class="mt-4 btn-primary">Refresh</button>
    </div>
  </div>
  <RouterView v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const crashed = ref(false);

onErrorCaptured((err) => {
  console.error('App error:', err);
  crashed.value = true;
  return false;
});

function reload() {
  window.location.reload();
}

onMounted(() => auth.fetchMe());
</script>
