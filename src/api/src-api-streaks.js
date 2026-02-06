// src/api/streaks.js
import { supabase } from '../utils/supabase';
import { format, differenceInDays, subDays } from 'date-fns';

/**
 * Record daily login
 */
export const recordLogin = async (studentId) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // 1. Insert login record (will be ignored if already exists due to UNIQUE constraint)
    const { error: loginError } = await supabase
      .from('login_history')
      .upsert(
        {
          student_id: studentId,
          login_date: today,
        },
        {
          onConflict: 'student_id,login_date',
          ignoreDuplicates: true,
        }
      );

    if (loginError) throw loginError;

    // 2. Update streak
    await updateStreak(studentId);

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Update streak calculation
 */
export const updateStreak = async (studentId) => {
  try {
    // Get all login dates for student
    const { data: logins, error: loginsError } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('student_id', studentId)
      .order('login_date', { ascending: false });

    if (loginsError) throw loginsError;

    if (!logins || logins.length === 0) {
      return { error: null };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak
    const sortedDates = logins.map(l => l.login_date).sort((a, b) => new Date(b) - new Date(a));
    
    // Check if logged in today or yesterday
    const mostRecentLogin = sortedDates[0];
    const daysSinceLastLogin = differenceInDays(new Date(today), new Date(mostRecentLogin));

    if (daysSinceLastLogin <= 1) {
      currentStreak = 1;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = differenceInDays(new Date(sortedDates[i - 1]), new Date(sortedDates[i]));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const daysDiff = differenceInDays(new Date(sortedDates[i - 1]), new Date(sortedDates[i]));
      
      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Update or insert streak tracking
    const { error: streakError } = await supabase
      .from('streak_tracking')
      .upsert({
        student_id: studentId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_login_date: today,
        total_login_days: logins.length,
      });

    if (streakError) throw streakError;

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get current streak data
 */
export const getStreakData = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('streak_tracking')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no streak data exists, initialize it
    if (!data) {
      const { error: initError } = await supabase
        .from('streak_tracking')
        .insert({
          student_id: studentId,
          current_streak: 0,
          longest_streak: 0,
          total_login_days: 0,
        });

      if (initError) throw initError;

      return {
        streakData: {
          current_streak: 0,
          longest_streak: 0,
          total_login_days: 0,
          last_login_date: null,
        },
        error: null,
      };
    }

    return { streakData: data, error: null };
  } catch (error) {
    return { streakData: null, error };
  }
};

/**
 * Get login calendar data (for visualization)
 */
export const getLoginCalendar = async (studentId, days = 90) => {
  try {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('student_id', studentId)
      .gte('login_date', startDate)
      .order('login_date', { ascending: true });

    if (error) throw error;

    // Convert to calendar format (array of dates)
    const loginDates = data.map(item => item.login_date);

    return { loginDates, error: null };
  } catch (error) {
    return { loginDates: null, error };
  }
};

/**
 * Get streak statistics
 */
export const getStreakStats = async (studentId) => {
  try {
    const { streakData, error: streakError } = await getStreakData(studentId);
    if (streakError) throw streakError;

    const { loginDates, error: calendarError } = await getLoginCalendar(studentId);
    if (calendarError) throw calendarError;

    // Calculate additional statistics
    const stats = {
      currentStreak: streakData.current_streak,
      longestStreak: streakData.longest_streak,
      totalLoginDays: streakData.total_login_days,
      lastLoginDate: streakData.last_login_date,
      loginDates: loginDates,
    };

    return { stats, error: null };
  } catch (error) {
    return { stats: null, error };
  }
};

/**
 * Check if user needs to maintain streak (logged in yesterday but not today)
 */
export const needsStreakMaintenance = async (studentId) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Check if logged in today
    const { data: todayLogin } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('student_id', studentId)
      .eq('login_date', today)
      .single();

    // Check if logged in yesterday
    const { data: yesterdayLogin } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('student_id', studentId)
      .eq('login_date', yesterday)
      .single();

    const needsMaintenance = !!yesterdayLogin && !todayLogin;

    return { needsMaintenance, error: null };
  } catch (error) {
    return { needsMaintenance: false, error };
  }
};

/**
 * Get streak achievements (milestones)
 */
export const getStreakAchievements = (currentStreak, longestStreak) => {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  
  const achievements = {
    current: [],
    upcoming: null,
  };

  // Current achievements
  milestones.forEach(milestone => {
    if (currentStreak >= milestone) {
      achievements.current.push({
        milestone,
        title: getAchievementTitle(milestone),
        achieved: true,
      });
    }
  });

  // Upcoming achievement
  const nextMilestone = milestones.find(m => m > currentStreak);
  if (nextMilestone) {
    achievements.upcoming = {
      milestone: nextMilestone,
      title: getAchievementTitle(nextMilestone),
      daysRemaining: nextMilestone - currentStreak,
    };
  }

  return achievements;
};

/**
 * Helper to get achievement title
 */
const getAchievementTitle = (days) => {
  const titles = {
    7: '🔥 Week Warrior',
    14: '⚡ Two-Week Thunder',
    30: '🌟 Month Master',
    60: '💪 60-Day Champion',
    90: '🏆 Quarter Conqueror',
    180: '👑 Half-Year Hero',
    365: '🎖️ Year-Long Legend',
  };

  return titles[days] || `${days}-Day Streak`;
};
