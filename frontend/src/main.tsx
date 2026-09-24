import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
<<<<<<< HEAD
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
=======
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const maybeStatus = (error as unknown as { status?: number })?.status;
        if (maybeStatus === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
>>>>>>> origin/main
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
