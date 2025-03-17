import axios from "axios";

const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

export const retryPolicy = (failureCount: number, error: any) => {
  // Only retry on 5xx errors or network/timeout issues
  const status = error.response?.status;
  return (
    failureCount < 3 && // Maximum 3 retries
    (status === undefined || // Network/timeout error
      status >= 500) // Server error
  );
};

export const retryDelay = (attemptIndex: number) =>
  Math.min(1000 * 2 ** attemptIndex, 30000);

export default apiClient;
