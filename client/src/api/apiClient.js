import axios from 'axios';

let accessToken = '';
let logoutCallback = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't retry if the 401 was from the refresh-token endpoint itself or login/register
      if (
        originalRequest.url.includes('/auth/refresh-token') ||
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      try {
        // Silent refresh — use absolute URL derived from env to work in production
        const refreshBaseURL = import.meta.env.VITE_API_URL || '/api/v1';
        const response = await axios.post(
          `${refreshBaseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (response.data && response.data.success) {
          const newToken = response.data.data.accessToken;
          setAccessToken(newToken);
          
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Session refresh failed. Logging out...', refreshError);
        logoutCallback();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
