import axios from 'axios';

// Determine the base URL based on the environment
let baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export let baseURL2 = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ApiClient = axios.create({
  baseURL: baseURL,
});

// Add a request interceptor to include auth token if available
ApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('zetly-api-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
ApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Function to handle 401 Unauthorized responses
const handleUnauthorized = () => {
  // Clear localStorage and update context or state
  localStorage.removeItem('zetly-api-token');
  localStorage.removeItem('zetly-current-user');
};

export default ApiClient;
