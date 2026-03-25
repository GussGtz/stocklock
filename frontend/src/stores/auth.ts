import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'WAREHOUSE' | 'SALES' | 'VIEWER'
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('stocklock_token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isManager = computed(() => ['ADMIN', 'MANAGER'].includes(user.value?.role ?? ''))
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
  )

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data } = await authApi.login({ email, password })
      token.value = data.accessToken
      user.value = data.user
      localStorage.setItem('stocklock_token', data.accessToken)
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const { data } = await authApi.profile()
      user.value = data
    } catch {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('stocklock_token')
  }

  function can(roles: string[]) {
    return roles.includes(user.value?.role ?? '')
  }

  function updateUser(data: Partial<AuthUser>) {
    if (user.value) user.value = { ...user.value, ...data }
  }

  return { user, token, loading, isAuthenticated, isAdmin, isManager, fullName, login, fetchProfile, logout, can, updateUser }
})
