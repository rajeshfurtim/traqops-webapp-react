import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const SidebarContext = createContext(null)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggleSidebar }),
    [collapsed, toggleSidebar]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

