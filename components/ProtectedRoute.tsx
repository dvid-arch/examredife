import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import Card from './Card.tsx';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card><p className="p-8">Checking authentication...</p></Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /dashboard page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they log in.
    // The AuthProvider's login logic will handle the redirection after successful login.
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // If the user is logged in but not an admin, send them to the main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
