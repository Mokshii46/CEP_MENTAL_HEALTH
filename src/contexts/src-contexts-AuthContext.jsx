// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabase';
import { getCurrentUserProfile } from '../api/auth';
import { recordLogin } from '../api/streaks';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRoleProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      const { user: userData, profile: profileData, roleProfile: roleProfileData, error: profileError } = 
        await getCurrentUserProfile();

      if (profileError) throw profileError;

      setUser(userData);
      setProfile(profileData);
      setRoleProfile(roleProfileData);

      // Record login if student
      if (profileData.role === 'student') {
        await recordLogin(authUser.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  const value = {
    user,
    profile,
    roleProfile,
    loading,
    error,
    refreshProfile,
    isStudent: profile?.role === 'student',
    isCounselor: profile?.role === 'counselor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
