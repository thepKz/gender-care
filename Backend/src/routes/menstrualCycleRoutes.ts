import express from 'express';
import {
    createCycle,
    getCycles,
    getCycleDetail,
    updateCycle,
    deleteCycle,
    createOrUpdateCycleDay,
    getCycleDays,
    getCycleDayDetail,
    updateCycleDay,
    deleteCycleDay,
    getCalendarData,
    generateCycleReport,
    compareThreeCycles,
    updateReminderSettings,
    getReminderSettings,
    getCycleReport,
    triggerReminders,
    getReminderStats,
    generatePostPeakDays,
    validateDayInput,
    getGenderPrediction,
    getCycleAnalysis,
    autoCompleteCycle,
    getCycleGuidance,
    testEmailReminder,
    autoFixCycleData,
    validateAdvancedCycleDay,
    getDetailedCycleReport,
    getThreeCycleComparison,
    getPredictiveAnalysis,
    getHealthAssessment,
    resetAllCycles,
    createFlexibleCycle,
    cleanDuplicateCycleDays
} from '../controllers/menstrualCycleController';
import { verifyToken as authenticate } from '../middleware/auth';
import { requireFemaleGender } from '../middleware/genderCheck';

const router = express.Router();

// Routes cho Menstrual Cycles
router.post('/menstrual-cycles', authenticate, createCycle);
router.get('/menstrual-cycles', authenticate, getCycles);
router.get('/menstrual-cycles/calendar', authenticate, getCalendarData);

// ==================== ADVANCED CYCLE REPORTS ====================
// Routes cho báo cáo chi tiết và phân tích sức khỏe (phải đặt trước :id)
router.get('/menstrual-cycles/three-cycle-comparison', authenticate, requireFemaleGender, getThreeCycleComparison);
router.get('/menstrual-cycles/predictive-analysis', authenticate, requireFemaleGender, getPredictiveAnalysis);
router.get('/menstrual-cycles/health-assessment', authenticate, requireFemaleGender, getHealthAssessment);

router.get('/menstrual-cycles/:id', authenticate, getCycleDetail);
router.get('/menstrual-cycles/:id/detailed-report', authenticate, requireFemaleGender, getDetailedCycleReport);
router.put('/menstrual-cycles/:id', authenticate, updateCycle);
router.delete('/menstrual-cycles/:id', authenticate, deleteCycle);

// Routes cho Cycle Days
router.post('/cycle-days', authenticate, createOrUpdateCycleDay);
router.get('/menstrual-cycles/:id/cycle-days', authenticate, getCycleDays);
router.get('/cycle-days/:id', authenticate, getCycleDayDetail);
router.put('/cycle-days/:id', authenticate, updateCycleDay);
router.delete('/cycle-days/:id', authenticate, deleteCycleDay);

// Routes cho Reports
router.post('/reports/generate/:cycleId', authenticate, generateCycleReport);
router.get('/reports/:cycleId', authenticate, getCycleReport);
router.get('/reports/comparison', authenticate, compareThreeCycles);

// Routes cho Reminders
router.get('/reminders', authenticate, getReminderSettings);
router.put('/reminders', authenticate, updateReminderSettings);
router.post('/reminders/notify', triggerReminders); // Public endpoint cho cronjob
router.get('/reminders/stats', authenticate, getReminderStats);
router.post('/reminders/test-email', authenticate, testEmailReminder);

// Routes cho Logic Phân Tích và Gợi Ý
router.post('/logic/generate-post-peak', authenticate, generatePostPeakDays);
router.post('/logic/validate-day', authenticate, validateDayInput);
router.get('/logic/gender-prediction/:cycleId', authenticate, getGenderPrediction);

// Routes cho Cycle Analysis (Báo cáo phân tích)
router.get('/menstrual-cycles/:id/analysis', authenticate, getCycleAnalysis);
router.get('/menstrual-cycles/:id/guidance', authenticate, getCycleGuidance);
router.post('/menstrual-cycles/:id/auto-complete', authenticate, autoCompleteCycle);

// Routes cho Data Recovery & Advanced Validation
router.post('/menstrual-cycles/auto-fix', authenticate, requireFemaleGender, autoFixCycleData);
router.post('/menstrual-cycles/validate-advanced', authenticate, requireFemaleGender, validateAdvancedCycleDay);

// ==================== FLEXIBLE CYCLE MANAGEMENT ====================
// Routes cho quản lý chu kỳ linh hoạt
router.post('/menstrual-cycles/reset-all', authenticate, requireFemaleGender, resetAllCycles);
router.post('/menstrual-cycles/create-flexible', authenticate, requireFemaleGender, createFlexibleCycle);

// Routes cho data cleaning
router.post('/menstrual-cycles/clean-duplicates', authenticate, requireFemaleGender, cleanDuplicateCycleDays);

export default router; 