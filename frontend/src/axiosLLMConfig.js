import axios from "axios";

const LLMAxiosInstance = axios.create({
  // FastAPI on port 8008. This should match the backend LLM service port
  baseURL: "http://localhost:8008",
  // baseURL: "http://172.17.231.72:8008", // Change ip and port number during dockerization/deployment
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple interceptor for LLM service
LLMAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("LLM Service Error:", error);
    return Promise.reject(error);
  }
);

export default LLMAxiosInstance;
