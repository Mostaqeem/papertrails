import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: "http://172.17.231.72:8003/api/", // <--- use localhost, not 127.0.0.1
  baseURL: "http://localhost:8000/api/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to automatically include CSRF and handle FormData
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't set Content-Type for FormData - let axios handle it automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    const token = localStorage.getItem("token"); // sliding token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle CSRF errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Check for refreshed token in response headers
    const newToken = response.headers['x-refreshed-token'];
    if (newToken) {
      localStorage.setItem("token", newToken);
    }
    return response;
  },
  async (error) => {
    // Check if this is a specific endpoint where 403 is expected for executives
    const isExecutiveEndpoint = error.config?.url?.includes('form-data') ||
      error.config?.url?.includes('create') ||
      error.config?.url?.includes('edit') ||
      error.config?.url?.includes('submit') ||
      error.config?.url?.includes('agreements');

    // Only logout on 401 (unauthorized) or 403 (forbidden) on non-executive endpoints
    if (error.response?.status === 401 ||
      (error.response?.status === 403 && !isExecutiveEndpoint)) {
      // Session expired or access denied on protected endpoints — clear any local state & redirect
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem("token");
      window.location.href = "/signin";
      return;
    }

    // For 403 errors on executive endpoints, don't logout but let the component handle the error
    if (error.response?.status === 403 && isExecutiveEndpoint) {
      // This is expected for executive users, don't logout
      console.log('Access denied on executive endpoint:', error.config?.url);
      return Promise.reject(error);
    }

    // Define endpoints where 403 is expected and should be handled in components
    const componentHandled403Endpoints = [
      'agreements', // All agreement-related endpoints
      'form-data',
      'create',
      'edit',
      'submit'
    ];
    const url = error.config?.url || '';
    const shouldComponentHandle403 = componentHandled403Endpoints.some(
      endpoint => url.includes(endpoint)
    );
    // For 403: only logout if it's NOT a component-handled endpoint
    if (error.response?.status === 403 && !shouldComponentHandle403) {
      // localStorage.removeItem('isLoggedIn');
      // localStorage.removeItem("token");
      window.location.href = "/agreements"; // redirect to a safe page
      return;
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;