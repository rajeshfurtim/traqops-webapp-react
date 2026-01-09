import { createContext, useContext, useState, useEffect } from 'react'

const ClientContext = createContext(null)

export const useClient = () => {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within ClientProvider')
  }
  return context
}

const STORAGE_KEY = 'selectedClient'
const DEFAULT_CLIENT = 'All'

export const ClientProvider = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState(() => {
    // Load from localStorage on init, default to "All" if not found
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored || DEFAULT_CLIENT
  })
  const [isChanging, setIsChanging] = useState(false)

  // Persist to localStorage whenever client changes
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem(STORAGE_KEY, selectedClient)
    } else {
      localStorage.setItem(STORAGE_KEY, DEFAULT_CLIENT)
    }
  }, [selectedClient])

  const changeClient = (client) => {
    setIsChanging(true)
    // Small delay for transition animation
    setTimeout(() => {
      setSelectedClient(client)
      setIsChanging(false)
    }, 300)
  }

  const clearClient = () => {
    setIsChanging(true)
    setTimeout(() => {
      setSelectedClient(null)
      setIsChanging(false)
    }, 300)
  }

  return (
    <ClientContext.Provider
      value={{
        selectedClient,
        changeClient,
        clearClient,
        isChanging
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

