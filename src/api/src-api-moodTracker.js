// src/api/moodTracker.js
import { supabase } from '../utils/supabase';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, format } from 'date-fns';

/**
 * Check if student has submitted mood entry for today
 */
export const hasTodayMoodEntry = async (studentId) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .select('id')
      .eq('student_id', studentId)
      .eq('entry_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return { hasEntry: !!data, error: null };
  } catch (error) {
    return { hasEntry: false, error };
  }
};

/**
 * Submit daily mood entry
 */
export const submitMoodEntry = async (studentId, moodData) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .insert({
        student_id: studentId,
        entry_date: today,
        mood_emoji: moodData.moodEmoji,
        stress_emoji: moodData.stressEmoji,
        anxiety_emoji: moodData.anxietyEmoji,
        sleep_quality_emoji: moodData.sleepQualityEmoji,
        energy_level_emoji: moodData.energyLevelEmoji,
        notes: moodData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { entry: data, error: null };
  } catch (error) {
    return { entry: null, error };
  }
};

/**
 * Update today's mood entry
 */
export const updateTodayMoodEntry = async (studentId, moodData) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .update({
        mood_emoji: moodData.moodEmoji,
        stress_emoji: moodData.stressEmoji,
        anxiety_emoji: moodData.anxietyEmoji,
        sleep_quality_emoji: moodData.sleepQualityEmoji,
        energy_level_emoji: moodData.energyLevelEmoji,
        notes: moodData.notes || null,
      })
      .eq('student_id', studentId)
      .eq('entry_date', today)
      .select()
      .single();

    if (error) throw error;

    return { entry: data, error: null };
  } catch (error) {
    return { entry: null, error };
  }
};

/**
 * Get mood entries for current week
 */
export const getWeeklyMoodData = async (studentId) => {
  try {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .select('*')
      .eq('student_id', studentId)
      .gte('entry_date', weekStart)
      .lte('entry_date', weekEnd)
      .order('entry_date', { ascending: true });

    if (error) throw error;

    // Aggregate mood counts
    const moodCounts = aggregateMoodCounts(data);

    return { entries: data, moodCounts, error: null };
  } catch (error) {
    return { entries: null, moodCounts: null, error };
  }
};

/**
 * Get mood entries for a specific month
 */
export const getMonthlyMoodData = async (studentId, date = new Date()) => {
  try {
    const monthStart = format(startOfMonth(date), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .select('*')
      .eq('student_id', studentId)
      .gte('entry_date', monthStart)
      .lte('entry_date', monthEnd)
      .order('entry_date', { ascending: true });

    if (error) throw error;

    // Aggregate mood counts
    const moodCounts = aggregateMoodCounts(data);

    return { entries: data, moodCounts, error: null };
  } catch (error) {
    return { entries: null, moodCounts: null, error };
  }
};

/**
 * Get mood history (last N days)
 */
export const getMoodHistory = async (studentId, days = 30) => {
  try {
    const { data, error } = await supabase
      .from('daily_mood_entries')
      .select('*')
      .eq('student_id', studentId)
      .order('entry_date', { ascending: false })
      .limit(days);

    if (error) throw error;

    return { entries: data, error: null };
  } catch (error) {
    return { entries: null, error };
  }
};

/**
 * Get today's mood entry
 */
export const getTodayMoodEntry = async (studentId) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_mood_entries')
      .select('*')
      .eq('student_id', studentId)
      .eq('entry_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { entry: data, error: null };
  } catch (error) {
    return { entry: null, error };
  }
};

/**
 * Get login consistency data
 */
export const getLoginConsistency = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('login_history')
      .select('login_date')
      .eq('student_id', studentId)
      .order('login_date', { ascending: false });

    if (error) throw error;

    const totalLoginDays = data.length;

    return { totalLoginDays, loginDates: data, error: null };
  } catch (error) {
    return { totalLoginDays: 0, loginDates: null, error };
  }
};

/**
 * Helper function to aggregate mood counts
 */
const aggregateMoodCounts = (entries) => {
  const counts = {
    mood: {},
    stress: {},
    anxiety: {},
    sleep: {},
    energy: {},
  };

  entries.forEach(entry => {
    // Count mood
    if (entry.mood_emoji) {
      counts.mood[entry.mood_emoji] = (counts.mood[entry.mood_emoji] || 0) + 1;
    }
    // Count stress
    if (entry.stress_emoji) {
      counts.stress[entry.stress_emoji] = (counts.stress[entry.stress_emoji] || 0) + 1;
    }
    // Count anxiety
    if (entry.anxiety_emoji) {
      counts.anxiety[entry.anxiety_emoji] = (counts.anxiety[entry.anxiety_emoji] || 0) + 1;
    }
    // Count sleep quality
    if (entry.sleep_quality_emoji) {
      counts.sleep[entry.sleep_quality_emoji] = (counts.sleep[entry.sleep_quality_emoji] || 0) + 1;
    }
    // Count energy level
    if (entry.energy_level_emoji) {
      counts.energy[entry.energy_level_emoji] = (counts.energy[entry.energy_level_emoji] || 0) + 1;
    }
  });

  return counts;
};

/**
 * Get mood analytics for visualization
 */
export const getMoodAnalytics = async (studentId, period = 'week') => {
  try {
    let data;
    if (period === 'week') {
      const result = await getWeeklyMoodData(studentId);
      data = result.entries;
    } else if (period === 'month') {
      const result = await getMonthlyMoodData(studentId);
      data = result.entries;
    } else {
      throw new Error('Invalid period. Use "week" or "month"');
    }

    // Prepare data for charting
    const chartData = data.map(entry => ({
      date: entry.entry_date,
      mood: entry.mood_emoji,
      stress: entry.stress_emoji,
      anxiety: entry.anxiety_emoji,
      sleep: entry.sleep_quality_emoji,
      energy: entry.energy_level_emoji,
    }));

    const moodCounts = aggregateMoodCounts(data);

    return { chartData, moodCounts, error: null };
  } catch (error) {
    return { chartData: null, moodCounts: null, error };
  }
};
