import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PastQuestionsProvider } from './contexts/PastQuestionsContext.tsx';
import { UserProgressProvider } from './contexts/UserProgressContext.tsx';
import { EngagementProvider } from './contexts/EngagementContext.tsx';
import { PwaInstallProvider } from './contexts/PwaContext.tsx';

// Import your publishable key
const PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PwaInstallProvider>
              <PastQuestionsProvider>
                <UserProgressProvider>
                  <EngagementProvider>
                    <App />
                  </EngagementProvider>
                </UserProgressProvider>
              </PastQuestionsProvider>
            </PwaInstallProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>
);