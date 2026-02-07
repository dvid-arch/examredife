import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Route, Navigate, Outlet, createHashRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

// Components
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import PwaInstallBanner from './components/PwaInstallBanner.tsx';

// Contexts
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PwaInstallProvider } from './contexts/PwaContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { UserProgressProvider } from './contexts/UserProgressContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';

// Pages - Lazy load all pages for faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Flashcards = lazy(() => import('./pages/Flashcards.tsx'));
const Quizzes = lazy(() => import('./pages/Quizzes.tsx'));
const ExamWithAI = lazy(() => import('./pages/ExamWithAI.tsx'));
const StudyGuides = lazy(() => import('./pages/StudyGuides.tsx'));
const TakeExamination = lazy(() => import('./pages/TakeExamination.tsx'));
const EducationalGames = lazy(() => import('./pages/EducationalGames.tsx'));
const Performance = lazy(() => import('./pages/Performance.tsx'));
const MemoryMatchGame = lazy(() => import('./pages/MemoryMatchGame.tsx'));
const SubjectSprintGame = lazy(() => import('./pages/SubjectSprintGame.tsx'));
const CareerInstitutions = lazy(() => import('./pages/CareerInstitutions.tsx'));
const UtmeChallenge = lazy(() => import('./pages/UtmeChallenge.tsx'));
const ComingSoon = lazy(() => import('./pages/ComingSoon.tsx'));
const QuestionSearch = lazy(() => import('./pages/QuestionSearch.tsx'));
const Profile = lazy(() => import('./pages/Profile.tsx'));
const Literature = lazy(() => import('./pages/Literature.tsx'));
const Dictionary = lazy(() => import('./pages/Dictionary.tsx'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));

// Admin - Lazy load admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers.tsx'));
const ManageContent = lazy(() => import('./pages/admin/ManageContent.tsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.tsx'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
    </div>
  </div>
);

// --- Root Layout with Providers ---
const RootLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UserProgressProvider>
            <PwaInstallProvider>
              <Outlet />
              <PwaInstallBanner />
            </PwaInstallProvider>
          </UserProgressProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

// --- Main Layout for the entire app ---
const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when navigating to a new page
  useEffect(() => {
    const handleHashChange = () => {
      setIsSidebarOpen(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="flex h-screen h-[100dvh] bg-gray-100 dark:bg-gray-950 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 sm:pb-4 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// Create router with data API to support useBlocker and other modern features
const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      {/* Main App Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/flashcards" element={<Suspense fallback={<PageLoader />}><Flashcards /></Suspense>} />
        <Route path="/practice" element={<Suspense fallback={<PageLoader />}><Quizzes /></Suspense>} />
        <Route path="/ai-buddy" element={<Suspense fallback={<PageLoader />}><ExamWithAI /></Suspense>} />
        <Route path="/question-search" element={<Suspense fallback={<PageLoader />}><QuestionSearch /></Suspense>} />
        <Route path="/study-guides" element={<Suspense fallback={<PageLoader />}><StudyGuides /></Suspense>} />
        <Route path="/games" element={<Suspense fallback={<PageLoader />}><EducationalGames /></Suspense>} />
        <Route path="/games/memory-match" element={<Suspense fallback={<PageLoader />}><MemoryMatchGame /></Suspense>} />
        <Route path="/games/subject-sprint" element={<Suspense fallback={<PageLoader />}><SubjectSprintGame /></Suspense>} />
        <Route path="/performance" element={<Suspense fallback={<PageLoader />}><Performance /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="/career-institutions" element={<Suspense fallback={<PageLoader />}><CareerInstitutions /></Suspense>} />
        <Route path="/challenge" element={<Suspense fallback={<PageLoader />}><UtmeChallenge /></Suspense>} />
        <Route path="/literature" element={<Suspense fallback={<PageLoader />}><Literature /></Suspense>} />
        <Route path="/dictionary" element={<Suspense fallback={<PageLoader />}><Dictionary /></Suspense>} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<PageLoader />}>
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          </Suspense>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><ManageUsers /></Suspense>} />
        <Route path="content" element={<Suspense fallback={<PageLoader />}><ManageContent /></Suspense>} />
      </Route>

      <Route
        path="/take-examination"
        element={<Suspense fallback={<PageLoader />}><TakeExamination /></Suspense>}
      />
      <Route
        path="/verify-email/:token"
        element={<Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense>}
      />
      <Route
        path="/reset-password/:token"
        element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  )
);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
