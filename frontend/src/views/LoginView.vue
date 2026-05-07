<template>
  <div class="min-h-screen bg-clinical-900 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-clinical-700 mb-4">
          <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-white">GenomePrioritizer</h1>
        <p class="text-clinical-300 text-sm mt-1">Variant prioritization platform</p>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-xl shadow-xl p-6">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Username</label>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="dr.chen"
              class="w-full rounded-lg border-slate-300 text-sm focus:ring-clinical-600 focus:border-clinical-600"
              :disabled="loading"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-lg border-slate-300 text-sm focus:ring-clinical-600 focus:border-clinical-600"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {{ error }}
          </div>

          <button type="submit" class="w-full btn-primary justify-center py-2" :disabled="loading">
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <div class="mt-5 pt-4 border-t border-slate-100">
          <p class="text-xs text-slate-400 mb-2 font-medium">Demo accounts (password: <code class="bg-slate-100 px-1 rounded">password123</code>)</p>
          <div class="space-y-1">
            <button v-for="u in demoUsers" :key="u.id"
              @click="username = u.id; password = 'password123'"
              class="w-full text-left px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <span class="font-mono font-medium text-clinical-700">{{ u.id }}</span>
              <span class="ml-2 text-slate-400">{{ u.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const demoUsers = [
  { id: 'dr.chen',     label: 'Oncology Admin' },
  { id: 'dr.park',     label: 'Oncology Editor' },
  { id: 'dr.torres',   label: 'Rare Disease Admin' },
  { id: 'dr.adams',    label: 'Cardiology Admin' },
  { id: 'nurse.davis', label: 'Oncology Viewer' },
];

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(username.value.trim(), password.value);
    router.push('/');
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Login failed. Check credentials.';
  } finally {
    loading.value = false;
  }
}
</script>
