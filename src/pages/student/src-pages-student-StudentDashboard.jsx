// src/pages/student/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasCompletedAssessment } from '../../api/assessment';
import { hasTodayMoodEntry } from '../../api/moodTracker';
import { getStreakData } from '../../api/streaks';

const StudentDashboard = () => {
  const { user, profile, roleProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [todayMoodSubmitted, setTodayMoodSubmitted] = useState(false);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      try {
        // Check if initial assessment is completed
        const { completed } = await hasCompletedAssessment(user.id);
        setAssessmentCompleted(completed);

        // If not completed, redirect to assessment
        if (!completed) {
          navigate('/student/initial-assessment', { replace: true });
          return;
        }

        // Check if today's mood entry is submitted
        const { hasEntry } = await hasTodayMoodEntry(user.id);
        setTodayMoodSubmitted(hasEntry);

        // Get streak data
        const { streakData: data } = await getStreakData(user.id);
        setStreakData(data);

      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}!
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Daily Mood Tracker Prompt */}
        {!todayMoodSubmitted && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  📊 How are you feeling today?
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Take a moment to track your mood and well-being.
                </p>
              </div>
              <button
                onClick={() => navigate('/student/mood-tracker')}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Track Mood
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Streak */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">🔥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Streak
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {streakData?.current_streak || 0} days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">🏆</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Longest Streak
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {streakData?.longest_streak || 0} days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Logins */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">📅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Check-ins
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {streakData?.total_login_days || 0} days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/student/mood-tracker')}
              className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <span className="text-4xl mb-2">😊</span>
              <span className="text-sm font-medium text-gray-900">
                Daily Mood
              </span>
            </button>

            <button
              onClick={() => navigate('/student/streaks')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <span className="text-4xl mb-2">🔥</span>
              <span className="text-sm font-medium text-gray-900">
                View Streaks
              </span>
            </button>

            <button
              onClick={() => navigate('/student/initial-assessment')}
              className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
            >
              <span className="text-4xl mb-2">📋</span>
              <span className="text-sm font-medium text-gray-900">
                Retake Assessment
              </span>
            </button>

            <button
              onClick={() => navigate('/student/profile')}
              className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <span className="text-4xl mb-2">👤</span>
              <span className="text-sm font-medium text-gray-900">
                My Profile
              </span>
            </button>
          </div>
        </div>

        {/* Mood Submitted Confirmation */}
        {todayMoodSubmitted && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Today's mood tracked!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Great job maintaining your mental health awareness. See you tomorrow!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
