import axios from 'axios'
import axiosRetry from 'axios-retry'

const apiClient = axios.create({
  timeout: 10000,
})

// Apply axiosRetry
axiosRetry(apiClient, {
  retries: 3, // Number of retry attempts
  retryDelay: retryCount => retryCount * 1000, // Incremental backoff
  retryCondition: error => {
    return (error.response?.status ?? 0) >= 500 || error.code === 'ECONNABORTED' // Retry on server errors or timeout
  },
})

export default apiClient