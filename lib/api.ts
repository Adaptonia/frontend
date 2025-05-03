export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_ROUTES = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  me: `${API_BASE_URL}/auth/me`,
  refreshToken: `${API_BASE_URL}/auth/refresh`,
  
  // Goals endpoints
  goals: `${API_BASE_URL}/goals`,
  goalById: (id: string) => `${API_BASE_URL}/goals/${id}`,
  toggleGoal: (id: string) => `${API_BASE_URL}/goals/${id}/toggle-complete`,
};