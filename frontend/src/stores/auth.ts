import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isLoggedIn = computed(() => !!token.value);
  const activeTeamId = ref<string | null>(null);

  function setActiveTeam(id: string) {
    activeTeamId.value = id;
  }

  async function login(username: string, password: string) {
    const { data } = await authApi.login(username, password);
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    if (data.user.teams.length) {
      activeTeamId.value = data.user.teams[0].id;
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      const { data } = await authApi.getMe();
      user.value = data;
      if (!activeTeamId.value && data.teams.length) {
        activeTeamId.value = data.teams[0].id;
      }
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    activeTeamId.value = null;
    localStorage.removeItem('token');
  }

  const activeTeam = computed(() =>
    user.value?.teams.find(t => t.id === activeTeamId.value) ?? null
  );

  const canEdit = computed(() =>
    activeTeam.value?.role === 'ADMIN' || activeTeam.value?.role === 'EDITOR'
  );

  return { user, token, isLoggedIn, activeTeamId, activeTeam, canEdit, login, logout, fetchMe, setActiveTeam };
});
