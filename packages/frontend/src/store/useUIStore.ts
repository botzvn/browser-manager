import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CanvasMode = "hand" | "select"

interface UIState {
  // Sidebar / Theme
  isSidebarExpanded: boolean
  toggleSidebar: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void

  // Automation layout UI
  showLogsPanel: boolean
  showVariablesPanel: boolean
  showVariablesDialog: boolean
  toggleLogsPanel: () => void
  toggleVariablesPanel: () => void
  toggleVariablesDialog: () => void

  // Canvas interaction mode
  canvasMode: CanvasMode
  setCanvasMode: (mode: CanvasMode) => void

  // Page Header
  pageTitle: string
  setPageTitle: (title: string) => void
  breadcrumbs: { label: string; path?: string; onClick?: () => void }[]
  setBreadcrumbs: (breadcrumbs: { label: string; path?: string; onClick?: () => void }[]) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar / Theme
      isSidebarExpanded: true,
      toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
      isDarkMode: false,
      toggleDarkMode: () => {
        set((state) => {
          const newMode = !state.isDarkMode
          if (newMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { isDarkMode: newMode }
        })
      },

      // Automation layout UI
      showLogsPanel: false,
      showVariablesPanel: false,
      showVariablesDialog: false,
      toggleLogsPanel: () => set((s) => ({ showLogsPanel: !s.showLogsPanel })),
      toggleVariablesPanel: () => set((s) => ({ showVariablesPanel: !s.showVariablesPanel })),
      toggleVariablesDialog: () => set((s) => ({ showVariablesDialog: !s.showVariablesDialog })),

      // Canvas mode — not persisted, always starts in hand mode
      canvasMode: "hand" as CanvasMode,
      setCanvasMode: (mode) => set({ canvasMode: mode }),

      // Page Header
      pageTitle: '',
      setPageTitle: (title: string) => set({ pageTitle: title, breadcrumbs: [] }),
      breadcrumbs: [],
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs, pageTitle: '' }),
    }),
    {
      name: 'botzvn-ui-storage', // unique name for localStorage keys
      partialize: (state) => ({
        isSidebarExpanded: state.isSidebarExpanded,
        isDarkMode: state.isDarkMode,
      }), // only persist theme and sidebar
    }
  )
)
