import { createRoot } from 'react-dom/client'
import axios from 'axios'

import App from './App.jsx'

// Global interceptor for token check + session expiry handling
axios.interceptors.request.use(
  (config) => {
    const tokenExists = document.cookie.includes('token=')

    const unprotectedRoutes = [
      '/api/auth/user/login',
      '/api/auth/user/register',
      '/api/auth/food-partner/login',
      '/api/auth/food-partner/register'
    ]

    const isPublic = unprotectedRoutes.some((path) => config.url?.includes(path))

    if (!tokenExists && !isPublic) {
      alert('Token not found or session expired')
      window.location.href = '/user/login'
      return Promise.reject(new axios.Cancel('token missing'))
    }

    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      alert('Token not found or session expired')
      window.location.href = '/user/login'
    }
    return Promise.reject(error)
  }
)

createRoot(document.getElementById('root')).render(
  <App />
)
