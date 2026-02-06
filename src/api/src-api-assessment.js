// src/api/assessment.js
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all active assessment questions with options
 */
export const getAssessmentQuestions = async () => {
  try {
    const { data: questions, error: questionsError } = await supabase
      .from('initial_assessment_questions')
      .select(`
        *,
        initial_assessment_options (*)
      `)
      .eq('is_active', true)
      .order('question_number', { ascending: true });

    if (questionsError) throw questionsError;

    return { questions, error: null };
  } catch (error) {
    return { questions: null, error };
  }
};

/**
 * Check if student has completed initial assessment
 */
export const hasCompletedAssessment = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('has_completed_initial_assessment')
      .eq('id', studentId)
      .single();

    if (error) throw error;

    return { completed: data.has_completed_initial_assessment, error: null };
  } catch (error) {
    return { completed: false, error };
  }
};

/**
 * Submit complete initial assessment
 */
export const submitInitialAssessment = async (studentId, responses) => {
  try {
    const sessionId = uuidv4();

    // 1. Insert all responses
    const responseRecords = responses.map(response => ({
      student_id: studentId,
      question_id: response.questionId,
      selected_option_id: response.selectedOptionId,
      remark: response.remark,
      severity_score: response.severityScore,
      assessment_session_id: sessionId,
    }));

    const { error: responsesError } = await supabase
      .from('initial_assessment_responses')
      .insert(responseRecords);

    if (responsesError) throw responsesError;

    // 2. Aggregate remarks and calculate scores by category
    const aggregatedRemarks = {};
    const categoryScores = {};

    responses.forEach(response => {
      const category = response.category;
      
      if (!aggregatedRemarks[category]) {
        aggregatedRemarks[category] = [];
        categoryScores[category] = [];
      }
      
      aggregatedRemarks[category].push(response.remark);
      categoryScores[category].push(response.severityScore);
    });

    // Calculate average score per category
    const finalCategoryScores = {};
    Object.keys(categoryScores).forEach(category => {
      const scores = categoryScores[category];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      finalCategoryScores[category] = parseFloat(average.toFixed(2));
    });

    // Calculate overall score
    const allScores = responses.map(r => r.severityScore);
    const overallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    // 3. Create assessment summary
    const { error: summaryError } = await supabase
      .from('initial_assessment_summary')
      .insert({
        student_id: studentId,
        assessment_session_id: sessionId,
        aggregated_remarks: aggregatedRemarks,
        category_scores: finalCategoryScores,
        overall_score: parseFloat(overallScore.toFixed(2)),
        ai_diagnosis: 'Pending AI Analysis', // Placeholder
        ai_insights: 'AI insights will be generated based on your responses.', // Placeholder
        ai_recommendations: 'Personalized recommendations coming soon.', // Placeholder
      });

    if (summaryError) throw summaryError;

    // 4. Update student profile
    const { error: updateError } = await supabase
      .from('student_profiles')
      .update({
        has_completed_initial_assessment: true,
        initial_assessment_date: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) throw updateError;

    return { success: true, sessionId, error: null };
  } catch (error) {
    return { success: false, sessionId: null, error };
  }
};

/**
 * Get student's assessment summary
 */
export const getAssessmentSummary = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('initial_assessment_summary')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return { summary: data, error: null };
  } catch (error) {
    return { summary: null, error };
  }
};

/**
 * Get student's detailed assessment responses
 */
export const getAssessmentResponses = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('initial_assessment_responses')
      .select(`
        *,
        initial_assessment_questions (
          question_text,
          category
        ),
        initial_assessment_options (
          option_text
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { responses: data, error: null };
  } catch (error) {
    return { responses: null, error };
  }
};

/**
 * Retake assessment (creates new session)
 */
export const retakeAssessment = async (studentId, responses) => {
  // Same as submitInitialAssessment but updates existing summary
  try {
    const sessionId = uuidv4();

    // Insert new responses
    const responseRecords = responses.map(response => ({
      student_id: studentId,
      question_id: response.questionId,
      selected_option_id: response.selectedOptionId,
      remark: response.remark,
      severity_score: response.severityScore,
      assessment_session_id: sessionId,
    }));

    const { error: responsesError } = await supabase
      .from('initial_assessment_responses')
      .insert(responseRecords);

    if (responsesError) throw responsesError;

    // Aggregate and calculate (same logic as initial submission)
    const aggregatedRemarks = {};
    const categoryScores = {};

    responses.forEach(response => {
      const category = response.category;
      
      if (!aggregatedRemarks[category]) {
        aggregatedRemarks[category] = [];
        categoryScores[category] = [];
      }
      
      aggregatedRemarks[category].push(response.remark);
      categoryScores[category].push(response.severityScore);
    });

    const finalCategoryScores = {};
    Object.keys(categoryScores).forEach(category => {
      const scores = categoryScores[category];
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      finalCategoryScores[category] = parseFloat(average.toFixed(2));
    });

    const allScores = responses.map(r => r.severityScore);
    const overallScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    // Update existing summary
    const { error: summaryError } = await supabase
      .from('initial_assessment_summary')
      .update({
        assessment_session_id: sessionId,
        aggregated_remarks: aggregatedRemarks,
        category_scores: finalCategoryScores,
        overall_score: parseFloat(overallScore.toFixed(2)),
        completed_at: new Date().toISOString(),
      })
      .eq('student_id', studentId);

    if (summaryError) throw summaryError;

    return { success: true, sessionId, error: null };
  } catch (error) {
    return { success: false, sessionId: null, error };
  }
};
