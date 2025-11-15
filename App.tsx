import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Flashcards from './pages/Flashcards.tsx';
import Quizzes from './pages/Quizzes.tsx';
import ExamWithAI from './pages/ExamWithAI.tsx';
import StudyGuides from './pages/StudyGuides.tsx';
import TakeExamination from './pages/TakeExamination.tsx';
import EducationalGames from './pages/EducationalGames.tsx';
import Performance from './pages/Performance.tsx';
import MemoryMatchGame from './pages/MemoryMatchGame.tsx';
import SubjectSprintGame from './pages/SubjectSprintGame.tsx';
import CareerInstitutions from './pages/CareerInstitutions.tsx';
import UtmeChallenge from './pages/UtmeChallenge.tsx';
import ComingSoon from './pages/ComingSoon.tsx';
import QuestionSearch from './pages/QuestionSearch.tsx';
import Profile from './pages/Profile.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { PwaInstallProvider } from './contexts/PwaContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import PwaInstallBanner from './components/PwaInstallBanner.tsx';

// Admin Imports
import AdminLayout from './pages/admin/AdminLayout.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import ManageUsers from './pages/admin/ManageUsers.tsx';
import ManageContent from './pages/admin/ManageContent.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';


// --- Main Layout for the entire app ---
const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PwaInstallProvider>
          <Routes>
              {/* Main App Routes */}
              <Route element={<MainLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/practice" element={<Quizzes />} />
                  <Route path="/ai-buddy" element={<ExamWithAI />} />
                  <Route path="/question-search" element={<QuestionSearch />} />
                  <Route path="/study-guides" element={<StudyGuides />} />
                  <Route path="/games" element={<EducationalGames />} />
                  <Route path="/games/memory-match" element={<MemoryMatchGame />} />
                  <Route path="/games/subject-sprint" element={<SubjectSprintGame />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/career-institutions" element={<CareerInstitutions />} />
                  <Route path="/challenge" element={<UtmeChallenge />} />
                  <Route path="/literature" element={<ComingSoon title="UTME Literature Books" />} />
                  <Route path="/dictionary" element={<ComingSoon title="Dictionary" />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="content" element={<ManageContent />} />
              </Route>

              {/* Fullscreen route still needs to be separate */}
              <Route path="/take-examination" element={<ProtectedRoute><TakeExamination /></ProtectedRoute>} />

              {/* Redirect any other path */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <PwaInstallBanner />
        </PwaInstallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;