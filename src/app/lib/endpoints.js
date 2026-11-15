const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_ORIGIN = configured.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const API_BASE = API_ORIGIN + '/api';
