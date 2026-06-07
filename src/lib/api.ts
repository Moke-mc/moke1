const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface FetchOptions extends RequestInit {
  timeout?: number
}

async function fetchAPI<T>(
  endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json() as T
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export { fetchAPI, API_BASE_URL }
