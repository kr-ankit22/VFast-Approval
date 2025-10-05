export const config = {
  frontendAppUrl: import.meta.env.VITE_FRONTEND_BASE_URL || process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5000',
  frontendLoginUrl: `${import.meta.env.VITE_FRONTEND_BASE_URL || process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5000'}${import.meta.env.VITE_FRONTEND_LOGIN_PATH || process.env.VITE_FRONTEND_LOGIN_PATH || '/auth'}`,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || '/api',
};