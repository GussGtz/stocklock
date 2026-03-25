import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Sidebar open/collapsed state — persisted
  const sidebarOpen = ref(localStorage.getItem('sl_sidebar') !== 'false')
  const sidebarCollapsed = ref(localStorage.getItem('sl_sidebar_collapsed') === 'true')

  // Dark mode — persisted
  const darkMode = ref(localStorage.getItem('sl_dark') === 'true')

  watch(darkMode, (val) => {
    localStorage.setItem('sl_dark', String(val))
    document.documentElement.classList.toggle('dark', val)
  }, { immediate: true })

  watch(sidebarOpen, (val) => {
    localStorage.setItem('sl_sidebar', String(val))
  })

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sl_sidebar_collapsed', String(val))
  })

  function toggleSidebar()   { sidebarOpen.value = !sidebarOpen.value }
  function toggleCollapsed()  { sidebarCollapsed.value = !sidebarCollapsed.value }
  function toggleDarkMode()   { darkMode.value = !darkMode.value }
  function closeSidebar()     { sidebarOpen.value = false }
  function openSidebar()      { sidebarOpen.value = true }

  return {
    sidebarOpen,
    sidebarCollapsed,
    darkMode,
    toggleSidebar,
    toggleCollapsed,
    toggleDarkMode,
    closeSidebar,
    openSidebar,
  }
})
