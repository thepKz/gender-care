/**
 * Doctor Service - Main entry point for doctor operations
 * Refactored to use modular services for better maintainability
 * 
 * This file now acts as a facade/proxy to the specialized services:
 * - doctorCrudService: Basic CRUD operations
 * - doctorScheduleService: Schedule management
 * - doctorStatisticsService: Statistics and reporting
 * - doctorBulkService: Bulk operations
 * - doctorValidationService: Validation utilities
 */

// Import all services from the doctor module
import * as DoctorServices from './doctor';

// Re-export all functions to maintain backward compatibility
// This ensures existing controllers continue to work without changes

// ===== CRUD OPERATIONS =====
export const getAllDoctors = DoctorServices.getAllDoctors;
export const getDoctorById = DoctorServices.getDoctorById;
export const createDoctor = DoctorServices.createDoctor;
export const updateDoctor = DoctorServices.updateDoctor;
export const deleteDoctor = DoctorServices.deleteDoctor;

// ===== SCHEDULE MANAGEMENT =====
export const getAllDoctorsSchedules = DoctorServices.getAllDoctorsSchedules;
export const getAllDoctorsSchedulesForStaff = DoctorServices.getAllDoctorsSchedulesForStaff;
export const getDoctorSchedules = DoctorServices.getDoctorSchedules;
export const getDoctorSchedulesForStaff = DoctorServices.getDoctorSchedulesForStaff;
export const createDoctorSchedule = DoctorServices.createDoctorSchedule;
export const updateDoctorSchedule = DoctorServices.updateDoctorSchedule;
export const deleteDoctorSchedule = DoctorServices.deleteDoctorSchedule;
export const getAvailableSlots = DoctorServices.getAvailableSlots;
export const getAvailableSlotsForStaff = DoctorServices.getAvailableSlotsForStaff;
export const getAvailableDoctors = DoctorServices.getAvailableDoctors;
export const getAvailableDoctorsForStaff = DoctorServices.getAvailableDoctorsForStaff;
export const setDoctorAbsentForDay = DoctorServices.setDoctorAbsentForDay;

// ===== STATISTICS & REPORTING =====
export const getDoctorStatistics = DoctorServices.getDoctorStatistics;
export const getAllDoctorsStatistics = DoctorServices.getAllDoctorsStatistics;
export const getSystemStatistics = DoctorServices.getSystemStatistics;

// ===== BULK OPERATIONS =====
export const createBulkDoctorSchedules = DoctorServices.createBulkDoctorSchedules;
export const setBulkDoctorAbsent = DoctorServices.setBulkDoctorAbsent;
export const deleteBulkDoctors = DoctorServices.deleteBulkDoctors;

// ===== VALIDATION UTILITIES =====
export const isValidObjectId = DoctorServices.isValidObjectId;
export const validateDoctorFields = DoctorServices.validateDoctorFields;
export const validateGender = DoctorServices.validateGender;
export const validateDateFormat = DoctorServices.validateDateFormat;
export const validateScheduleStatus = DoctorServices.validateScheduleStatus;
export const generateDoctorEmail = DoctorServices.generateDoctorEmail;
export const getVietnamDate = DoctorServices.getVietnamDate;
export const isWeekend = DoctorServices.isWeekend;
export const getDayInfo = DoctorServices.getDayInfo;

// ===== LEGACY COMPATIBILITY =====
// These functions maintain backward compatibility with existing API endpoints

// Legacy bulk schedule functions (mapped to new implementation)
export const createBulkDoctorSchedule = DoctorServices.createBulkDoctorSchedules;

// Legacy function names that might be used in controllers
export const createBulkDoctorScheduleForDays = async (doctorId: string, dates: string[]) => {
  return await DoctorServices.createBulkDoctorSchedules(doctorId, { dates });
};

export const createBulkDoctorScheduleForMonth = async (doctorId: string, month: number, year: number) => {
  // Generate all weekdays in the month
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Only weekdays (Monday to Friday)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
    }
  }
  
  return await DoctorServices.createBulkDoctorSchedules(doctorId, { dates });
};

/**
 * REFACTORING NOTES:
 * 
 * 1. ✅ Separated concerns into focused services
 * 2. ✅ Maintained backward compatibility
 * 3. ✅ Improved code organization and maintainability
 * 4. ✅ Made testing easier (each service can be tested independently)
 * 5. ✅ Reduced file size from 1097 lines to ~80 lines
 * 6. ✅ Followed Single Responsibility Principle
 * 
 * BENEFITS:
 * - Easier to maintain and debug
 * - Better separation of concerns
 * - Improved testability
 * - Reduced cognitive load
 * - Better team collaboration (different developers can work on different services)
 * - Easier to add new features without affecting existing code
 */ 