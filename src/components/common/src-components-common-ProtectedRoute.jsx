// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && profile) {
    if (!allowedRoles.includes(profile.role)) {
      // Redirect to appropriate dashboard based on role
      if (profile.role === 'student') {
        return <Navigate to="/student/dashboard" replace />;
      } else if (profile.role === 'counselor') {
        return <Navigate to="/counselor/dashboard" replace />;
      }
      // Fallback
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
