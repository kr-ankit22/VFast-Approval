const frontendBaseUrl = (import.meta.env && import.meta.env.VITE_FRONTEND_BASE_URL) || process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5000';
const frontendLoginPath = (import.meta.env && import.meta.env.VITE_FRONTEND_LOGIN_PATH) || process.env.VITE_FRONTEND_LOGIN_PATH || '/auth';
const apiBaseUrl = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || process.env.VITE_API_BASE_URL || '/api';

export const config = {
  frontendAppUrl: frontendBaseUrl,
  frontendLoginUrl: `${frontendBaseUrl}${frontendLoginPath}`,
  apiBaseUrl: apiBaseUrl,
};
