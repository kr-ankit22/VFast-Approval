const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://vfastbooking.netlify.app/auth' : 'http://localhost:5000/auth');

export { FRONTEND_BASE_URL };