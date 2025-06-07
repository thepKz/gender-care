import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import type { SearchFilterOptions, DoctorOption } from '../components/ui/AdvancedSearchFilter';
import type { IDoctorSchedule } from '../api/endpoints/doctorSchedule';
import type { DoctorScheduleEvent } from '../types/calendar';
import doctorApi, { type IDoctor } from '../api/endpoints/doctor';
import dayjs from 'dayjs';

interface UseAdvancedSearchProps {
  schedules: IDoctorSchedule[];
  events: DoctorScheduleEvent[];
}

const searchCache = new Map<string, DoctorOption[]>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useAdvancedSearch = ({ schedules, events }: UseAdvancedSearchProps) => {
  const [filteredSchedules, setFilteredSchedules] = useState<IDoctorSchedule[]>(schedules);
  const [filteredEvents, setFilteredEvents] = useState<DoctorScheduleEvent[]>(events);
  const [loading, setLoading] = useState(false);
  const [allDoctors, setAllDoctors] = useState<IDoctor[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilterOptions>({
    doctorSearch: '',
    selectedDoctorIds: [],
    selectedTimeSlots: [],
    selectedDaysOfWeek: [],
    dateRange: null,
    status: [],
    specializations: []
  });

  // Load all doctors on component mount
  useEffect(() => {
    const loadAllDoctors = async () => {
      try {
        console.log('🔄 Loading all doctors for filter dropdown...');
        const doctors = await doctorApi.getAll();
        setAllDoctors(doctors);
        console.log('✅ Loaded doctors for filters:', doctors.length);
      } catch (error) {
        console.error('❌ Error loading doctors for filters:', error);
      }
    };

    loadAllDoctors();
  }, []);

  const availableSpecializations = useMemo(() => {
    const specs = new Set<string>();
    
    // Sử dụng allDoctors từ API thay vì schedules
    allDoctors.forEach(doctor => {
      if (doctor.specialization) {
        specs.add(doctor.specialization);
      }
    });
    
    return Array.from(specs).sort();
  }, [allDoctors]);

  const availableTimeSlots = useMemo(() => {
    const slots = new Set<string>();
    schedules.forEach(schedule => {
      schedule.weekSchedule.forEach(week => {
        week.slots.forEach(slot => {
          slots.add(slot.slotTime);
        });
      });
    });
    return Array.from(slots).sort();
  }, [schedules]);

  const searchDoctors = useCallback(
    debounce(async (searchTerm: string): Promise<DoctorOption[]> => {
      if (!searchTerm.trim()) {
        // Nếu không có search term, return tất cả doctors có sẵn
        const results: DoctorOption[] = allDoctors.map(doctor => {
          const doctorSchedules = schedules.filter(schedule => 
            schedule.doctorId._id === doctor._id
          );
          
          const totalSlots = doctorSchedules.reduce(
            (total, schedule) => total + schedule.weekSchedule.reduce(
              (weekTotal, week) => weekTotal + week.slots.length, 0
            ), 0
          );
          
          const availableSlots = doctorSchedules.reduce(
            (total, schedule) => total + schedule.weekSchedule.reduce(
              (weekTotal, week) => weekTotal + week.slots.filter(slot => slot.status === 'Free').length, 0
            ), 0
          );

          return {
            id: doctor._id,
            name: doctor.userId.fullName,
            fullName: doctor.userId.fullName,
            specialization: doctor.specialization || 'Chưa xác định',
            totalSlots,
            availableSlots
          };
        });
        
        return results.slice(0, 10); // Limit to 10 results khi không search
      }

      const cacheKey = searchTerm.toLowerCase();
      const cached = searchCache.get(cacheKey);
      if (cached) return cached;

      setLoading(true);
      try {
        console.log('🔍 Searching doctors locally:', searchTerm, 'trong', allDoctors.length, 'bác sĩ');
        
        // Filter local từ allDoctors đã load sẵn
        const filteredDoctors = allDoctors.filter(doctor => {
          const fullName = doctor.userId.fullName.toLowerCase();
          const specialization = (doctor.specialization || '').toLowerCase();
          const search = searchTerm.toLowerCase();
          
          return fullName.includes(search) || specialization.includes(search);
        });

        console.log('🎯 Filtered doctors:', filteredDoctors.length);

        // Convert sang DoctorOption format và tính slots từ schedules
        const results: DoctorOption[] = filteredDoctors.map(doctor => {
          // Tìm schedule tương ứng để tính slots
          const doctorSchedules = schedules.filter(schedule => 
            schedule.doctorId._id === doctor._id
          );
          
          const totalSlots = doctorSchedules.reduce(
            (total, schedule) => total + schedule.weekSchedule.reduce(
              (weekTotal, week) => weekTotal + week.slots.length, 0
            ), 0
          );
          
          const availableSlots = doctorSchedules.reduce(
            (total, schedule) => total + schedule.weekSchedule.reduce(
              (weekTotal, week) => weekTotal + week.slots.filter(slot => slot.status === 'Free').length, 0
            ), 0
          );

          return {
            id: doctor._id,
            name: doctor.userId.fullName,
            fullName: doctor.userId.fullName,
            specialization: doctor.specialization || 'Chưa xác định',
            totalSlots,
            availableSlots
          };
        });

        console.log('✅ Search results:', results);

        // Cache results
        searchCache.set(cacheKey, results);
        setTimeout(() => searchCache.delete(cacheKey), CACHE_EXPIRY);

        return results;
      } catch (error) {
        console.error('❌ Error searching doctors:', error);
        return [];
      } finally {
        setLoading(false);
      }
    }, 300),
    [allDoctors, schedules] // Depend on allDoctors và schedules
  );

  const applyFilters = useCallback((filters: SearchFilterOptions) => {
    let filtered = [...schedules];
    let filteredEventList = [...events];

    if (filters.selectedDoctorIds.length > 0) {
      filtered = filtered.filter(schedule => 
        filters.selectedDoctorIds.includes(schedule.doctorId._id)
      );
      filteredEventList = filteredEventList.filter(event =>
        filters.selectedDoctorIds.includes(event.resource.doctorId)
      );
    }

    if (filters.specializations.length > 0) {
      filtered = filtered.filter(schedule =>
        filters.specializations.includes(schedule.doctorId.specialization || '')
      );
    }

    if (filters.selectedTimeSlots.length > 0) {
      filteredEventList = filteredEventList.filter(event =>
        filters.selectedTimeSlots.includes(event.resource.slotTime)
      );
    }

    if (filters.selectedDaysOfWeek.length > 0) {
      filteredEventList = filteredEventList.filter(event => {
        const dayOfWeek = dayjs(event.start).day();
        return filters.selectedDaysOfWeek.includes(dayOfWeek);
      });
    }

    if (filters.status.length > 0) {
      filteredEventList = filteredEventList.filter(event =>
        filters.status.includes(event.resource.status as any)
      );
    }

    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      filteredEventList = filteredEventList.filter(event => {
        const eventDate = dayjs(event.start);
        return eventDate.isAfter(startDate.subtract(1, 'day')) && 
               eventDate.isBefore(endDate.add(1, 'day'));
      });
    }

    setCurrentFilters(filters);
    setFilteredSchedules(filtered);
    setFilteredEvents(filteredEventList);
  }, [schedules, events]);

  const totalResults = useMemo(() => filteredEvents.length, [filteredEvents]);

  return {
    filteredSchedules,
    filteredEvents,
    searchDoctors,
    applyFilters,
    loading,
    totalResults,
    availableSpecializations,
    availableTimeSlots
  };
}; 