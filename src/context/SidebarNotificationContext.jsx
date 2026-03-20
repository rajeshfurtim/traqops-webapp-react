import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** Sidebar menu paths that can show a notification badge count */
export const CYCLIC_CHECK_NOTIFICATION_PATH = '/inventory/cyclic-check'

const SidebarNotificationContext = createContext(null)

export function SidebarNotificationProvider({ children }) {
  // Mock initial count — replace with API / RTK Query and setBadgeCount(path, n)
  const [badgeCounts, setBadgeCounts] = useState({
    [CYCLIC_CHECK_NOTIFICATION_PATH]: 3
  })

  const setBadgeCount = useCallback((path, count) => {
    setBadgeCounts((prev) => {
      if (count === 0 || count == null) {
        const next = { ...prev }
        delete next[path]
        return next
      }
      return { ...prev, [path]: Math.max(0, Number(count)) }
    })
  }, [])

  const value = useMemo(
    () => ({
      badgeCounts,
      setBadgeCount
    }),
    [badgeCounts, setBadgeCount]
  )

  return (
    <SidebarNotificationContext.Provider value={value}>
      {children}
    </SidebarNotificationContext.Provider>
  )
}

export function useSidebarNotifications() {
  const ctx = useContext(SidebarNotificationContext)
  if (!ctx) {
    throw new Error('useSidebarNotifications must be used within SidebarNotificationProvider')
  }
  return ctx
}
