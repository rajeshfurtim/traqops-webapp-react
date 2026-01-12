/**
 * Dynamic API Configuration
 * Automatically detects domain and constructs API base URL
 */

const extractDomainName = () => {
  if (typeof window === 'undefined') {
    return 'default'
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'default'
  }

  const hostnameWithoutPort = hostname.split(':')[0]
  const productionSuffix = '.traqops.com'
  const developmentSuffix = '.local.site'

  let domainName = hostnameWithoutPort

  if (hostnameWithoutPort.endsWith(productionSuffix)) {
    domainName = hostnameWithoutPort.replace(productionSuffix, '')
  } else if (hostnameWithoutPort.endsWith(developmentSuffix)) {
    domainName = hostnameWithoutPort.replace(developmentSuffix, '')
  }

  if (!domainName || domainName === hostnameWithoutPort) {
    if (hostnameWithoutPort.includes('.local.site') || hostnameWithoutPort.includes('.traqops.com')) {
      return hostnameWithoutPort
    }
    return 'default'
  }

  return domainName
}

const constructApiBaseUrl = () => {
  const isDevelopment = import.meta.env.DEV
  
  // In development, use relative URLs so Vite proxy forwards to backend
  if (isDevelopment) {
    return ''
  }
  
  // Production: construct from domain name
  const protocol = import.meta.env.VITE_API_PROTOCOL || 'https'
  const domainName = extractDomainName()
  const baseDomain = import.meta.env.VITE_API_BASE_DOMAIN || 'traqops.com'
  
  if (typeof window !== 'undefined' && (domainName.includes('.local.site') || domainName.includes('.traqops.com'))) {
    const port = window.location.port || ''
    return port ? `${protocol}://${domainName}:${port}` : `${protocol}://${domainName}`
  }
  
  if (domainName === 'default' && typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const port = window.location.port || ''
    return port ? `${protocol}://${hostname}:${port}` : `${protocol}://${hostname}`
  }
  
  return `${protocol}://${domainName}.${baseDomain}`
}

export const domainName = extractDomainName()
export const apiBaseUrl = constructApiBaseUrl()

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${apiBaseUrl}/${cleanEndpoint}`
}

