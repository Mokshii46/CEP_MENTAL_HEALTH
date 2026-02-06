// src/api/auth.js
import { supabase } from '../utils/supabase';

/**
 * Student Signup
 */
export const signUpStudent = async ({ email, password, fullName, studentId, major, yearOfStudy }) => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'student',
      });

    if (profileError) throw profileError;

    // 3. Create student profile
    const { error: studentProfileError } = await supabase
      .from('student_profiles')
      .insert({
        id: userId,
        student_id: studentId || null,
        major: major || null,
        year_of_study: yearOfStudy || null,
        has_completed_initial_assessment: false,
      });

    if (studentProfileError) throw studentProfileError;

    // 4. Initialize streak tracking
    const { error: streakError } = await supabase
      .from('streak_tracking')
      .insert({
        student_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_login_days: 0,
      });

    if (streakError) throw streakError;

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Counselor Signup
 */
export const signUpCounselor = async ({ email, password, fullName, specialization, licenseNumber, yearsOfExperience }) => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'counselor',
      });

    if (profileError) throw profileError;

    // 3. Create counselor profile
    const { error: counselorProfileError } = await supabase
      .from('counselor_profiles')
      .insert({
        id: userId,
        specialization: specialization || null,
        license_number: licenseNumber || null,
        years_of_experience: yearsOfExperience || null,
      });

    if (counselorProfileError) throw counselorProfileError;

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Sign In (Role-agnostic)
 */
export const signIn = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

/**
 * Sign Out
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get Current Session
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
};

/**
 * Get Current User Profile
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Get role-specific profile
    let roleProfile = null;
    if (profile.role === 'student') {
      const { data: studentProfile, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (studentError) throw studentError;
      roleProfile = studentProfile;
    } else if (profile.role === 'counselor') {
      const { data: counselorProfile, error: counselorError } = await supabase
        .from('counselor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (counselorError) throw counselorError;
      roleProfile = counselorProfile;
    }

    return { user, profile, roleProfile, error: null };
  } catch (error) {
    return { user: null, profile: null, roleProfile: null, error };
  }
};

/**
 * Password Reset Request
 */
export const requestPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Update Password
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
