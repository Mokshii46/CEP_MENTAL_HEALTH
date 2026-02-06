// src/routes/AppRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Common Components
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Public Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import InitialAssessmentPage from '../pages/student/InitialAssessmentPage';
import DailyMoodPage from '../pages/student/DailyMoodPage';
import StreaksPage from '../pages/student/StreaksPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';

// Counselor Pages
import CounselorDashboard from '../pages/counselor/CounselorDashboard';
import StudentDetailsPage from '../pages/counselor/StudentDetailsPage';
import CounselorProfilePage from '../pages/counselor/CounselorProfilePage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/initial-assessment"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <InitialAssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/mood-tracker"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <DailyMoodPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/streaks"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StreaksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Counselor Routes */}
        <Route
          path="/counselor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['counselor']}>
              <CounselorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/counselor/student/:studentId"
          element={
            <ProtectedRoute allowedRoles={['counselor']}>
              <StudentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/counselor/profile"
          element={
            <ProtectedRoute allowedRoles={['counselor']}>
              <CounselorProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Redirect based on role */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Component to redirect users to their role-specific dashboard
const RoleBasedRedirect = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  } else if (profile.role === 'counselor') {
    return <Navigate to="/counselor/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

export default AppRouter;
