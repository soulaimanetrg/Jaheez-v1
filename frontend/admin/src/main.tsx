import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/context/LanguageContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

import { TopErrorBoundary } from './TopErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TopErrorBoundary>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <BrowserRouter basename="/admin">
              <App />
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </React.StrictMode>
  </TopErrorBoundary>
);
