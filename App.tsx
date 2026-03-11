import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Route, Navigate, Outlet, createBrowserRouter, createRoutesFromElements, RouterProvider, useLocation } from 'react-router-dom';

// Components
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import PwaInstallBanner from './components/PwaInstallBanner.tsx';
import ScrollToTop from './components/ScrollToTop.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PwaInstallProvider } from './contexts/PwaContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { UserProgressProvider } from './contexts/UserProgressContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { PastQuestionsProvider } from './contexts/PastQuestionsContext.tsx';
import { EngagementProvider } from './contexts/EngagementContext.tsx';
import SmartNudge from './components/SmartNudge.tsx';
import { useVisualViewport } from './hooks/useVisualViewport.ts';

// Pages - Lazy load all pages for faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Journey = lazy(() => import('./pages/Journey.tsx'));
const Flashcards = lazy(() => import('./pages/Flashcards.tsx'));
const Quizzes = lazy(() => import('./pages/Quizzes.tsx'));
const ExamWithAI = lazy(() => import('./pages/ExamWithAI.tsx'));
const StudyGuides = lazy(() => import('./pages/StudyGuides.tsx'));
const StudyGuideLibrary = lazy(() => import('./pages/study-guides/StudyGuideLibrary.tsx'));
const SubjectIndex = lazy(() => import('./pages/study-guides/SubjectIndex.tsx'));
const GuideReader = lazy(() => import('./pages/study-guides/GuideReader.tsx'));
const GuideGenerator = lazy(() => import('./pages/study-guides/GuideGenerator.tsx'));
const TopicPracticeSetup = lazy(() => import('./pages/practice/TopicPracticeSetup.tsx'));
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
const AuthSuccess = lazy(() => import('./pages/AuthSuccess.tsx'));
const QuestionPage = lazy(() => import('./pages/QuestionPage.tsx'));


// Admin - Lazy load admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers.tsx'));
const PapersList = lazy(() => import('./pages/admin/PapersList.tsx'));
const PaperEditor = lazy(() => import('./pages/admin/PaperEditor.tsx'));
const GuidesList = lazy(() => import('./pages/admin/GuidesList.tsx'));
const GuideBuilder = lazy(() => import('./pages/admin/GuideBuilder.tsx'));
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
          <PastQuestionsProvider>
            <UserProgressProvider>
              <EngagementProvider>
                <PwaInstallProvider>
                  <Outlet />
                  <PwaInstallBanner />
                </PwaInstallProvider>
              </EngagementProvider>
            </UserProgressProvider>
          </PastQuestionsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

// --- Main Layout for the entire app ---
const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { height: viewportHeight } = useVisualViewport();
  const location = useLocation();

  // Close sidebar when navigating to a new page or using back button
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    const handlePopState = () => {
      setIsSidebarOpen(false);
    };

    const handleHashChange = () => {
      setIsSidebarOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div
      className="flex flex-row bg-gray-100 dark:bg-gray-950 font-sans overflow-hidden w-full relative"
      style={{ height: viewportHeight }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onNavigate={() => setIsSidebarOpen(false)}
        onClose={() => {
          if (isSidebarOpen) {
            if (window.history.state?.modal === 'sidebar') {
              window.history.back();
            } else {
              setIsSidebarOpen(false);
            }
          }
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ScrollToTop />
        <Header onMenuClick={() => {
          if (!isSidebarOpen) {
            window.history.pushState({ modal: 'sidebar' }, '');
            setIsSidebarOpen(true);
          }
        }} />
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 sm:pb-4 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
        <SmartNudge />
      </div>
    </div>
  );
};

// Create browser router for clean SEO friendly URLs
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<ErrorBoundary />}>
      {/* Main App Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/journey" element={<Suspense fallback={<PageLoader />}><Journey /></Suspense>} />
        <Route path="/flashcards" element={<Suspense fallback={<PageLoader />}><Flashcards /></Suspense>} />
        <Route path="/practice" element={<Suspense fallback={<PageLoader />}><Quizzes /></Suspense>} />
        <Route path="/practice/:tab" element={<Suspense fallback={<PageLoader />}><Quizzes /></Suspense>} />
        <Route path="/practice/topic/:subject/:topicSlug" element={<Suspense fallback={<PageLoader />}><TopicPracticeSetup /></Suspense>} />
        <Route path="/ai-buddy" element={<Suspense fallback={<PageLoader />}><ExamWithAI /></Suspense>} />
        <Route path="/question-search" element={<Suspense fallback={<PageLoader />}><QuestionSearch /></Suspense>} />
        <Route path="/study-guides" element={<Suspense fallback={<PageLoader />}><StudyGuides /></Suspense>}>
          <Route index element={<Suspense fallback={<PageLoader />}><StudyGuideLibrary /></Suspense>} />
          <Route path="generator" element={<Suspense fallback={<PageLoader />}><GuideGenerator /></Suspense>} />
          <Route path=":category" element={<Suspense fallback={<PageLoader />}><SubjectIndex /></Suspense>} />
          <Route path=":category/:slug" element={<Suspense fallback={<PageLoader />}><GuideReader /></Suspense>} />
        </Route>
        <Route path="/guides" element={<Navigate to="/study-guides" replace />} />
        <Route path="/guides/*" element={<Navigate to="/study-guides" replace />} />
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
        <Route path="papers" element={<Suspense fallback={<PageLoader />}><PapersList /></Suspense>} />
        <Route path="papers/:id" element={<Suspense fallback={<PageLoader />}><PaperEditor /></Suspense>} />
        <Route path="guides" element={<Suspense fallback={<PageLoader />}><GuidesList /></Suspense>} />
        <Route path="guides/:id" element={<Suspense fallback={<PageLoader />}><GuideBuilder /></Suspense>} />
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
      <Route
        path="/auth-success"
        element={<Suspense fallback={<PageLoader />}><AuthSuccess /></Suspense>}
      />
      <Route
        path="/question/:id"
        element={<Suspense fallback={<PageLoader />}><QuestionPage /></Suspense>}
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
