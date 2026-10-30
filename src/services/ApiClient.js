import axios from 'axios';

// Determine the base URL based on the environment
let baseURL;
export let baseURL2;

if (process.env.NODE_ENV === 'development') {
  baseURL = 'http://localhost:8000/api'; // Development baseURL
  baseURL2 = 'http://localhost:8000'; // Development baseURL
} else {
  baseURL = 'https://zetly.com/api'; // Production baseURL
  baseURL2 = 'https://zetly.com'; // Production baseURL
}

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
