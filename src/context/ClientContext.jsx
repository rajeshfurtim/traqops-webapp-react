import { createContext, useContext, useState, useEffect } from 'react'

const ClientContext = createContext(null)

export const useClient = () => {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within ClientProvider')
  }
  return context
}

const STORAGE_KEY = 'clientId'

export const ClientProvider = ({ children }) => {
  const [clientId, setClientId] = useState(() => {
    // Load from localStorage on init, default to null if not found
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? Number(stored) : null
  })
  const [isChanging, setIsChanging] = useState(false)

  // Persist to localStorage whenever client changes
  useEffect(() => {
    if (clientId !== null && clientId !== undefined) {
      localStorage.setItem(STORAGE_KEY, String(clientId))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [clientId])

  const changeClient = (client) => {
    // client is expected to be a numeric ID (e.g., 1090)
    setIsChanging(true)
    // Small delay for transition animation
    setTimeout(() => {
      setClientId(client)
      setIsChanging(false)
    }, 300)
  }

  const clearClient = () => {
    setIsChanging(true)
    setTimeout(() => {
      setClientId(null)
      setIsChanging(false)
    }, 300)
  }

  return (
    <ClientContext.Provider
      value={{
        clientId,
        changeClient,
        clearClient,
        isChanging
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

