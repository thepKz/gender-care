import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DoctorScheduleEvent } from '../types/calendar';

interface UseVirtualizedCalendarProps {
  events: DoctorScheduleEvent[];
  maxEventsPerDay?: number;
  enableVirtualization?: boolean;
}

export const useVirtualizedCalendar = ({
  events,
  maxEventsPerDay = 50,
  enableVirtualization = true
}: UseVirtualizedCalendarProps) => {
  const [currentViewRange, setCurrentViewRange] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    // Initialize with current month range to show events by default
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
    console.log('🗓️ [VirtualizedCalendar] Initial view range:', {
      start: start.toDateString(), 
      end: end.toDateString()
    });
    return { start, end };
  });

  // Group events by date for efficient filtering
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, DoctorScheduleEvent[]>();
    
    events.forEach(event => {
      const dateKey = event.start.toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  }, [events]);

  // Get visible events based on current view range
  const visibleEvents = useMemo(() => {
    console.log('🔍 [VirtualizedCalendar] Filtering events:', {
      totalEvents: events.length,
      enableVirtualization,
      viewRange: {
        start: currentViewRange.start.toDateString(),
        end: currentViewRange.end.toDateString()
      }
    });

    if (!enableVirtualization) return events;

    const visible: DoctorScheduleEvent[] = [];
    const start = currentViewRange.start.getTime();
    const end = currentViewRange.end.getTime();
    let filteredCount = 0;

    for (const [dateStr, dayEvents] of eventsByDate) {
      const eventDate = new Date(dateStr).getTime();
      
      if (eventDate >= start && eventDate <= end) {
        // Limit events per day if too many
        if (dayEvents.length > maxEventsPerDay) {
          visible.push(...dayEvents.slice(0, maxEventsPerDay));
        } else {
          visible.push(...dayEvents);
        }
      } else {
        filteredCount += dayEvents.length;
      }
    }

    console.log('📊 [VirtualizedCalendar] Filtering result:', {
      visibleEvents: visible.length,
      filteredOutEvents: filteredCount,
      byDateCount: eventsByDate.size
    });

    return visible;
  }, [eventsByDate, currentViewRange, maxEventsPerDay, enableVirtualization, events]);

  // Update view range when calendar navigates
  const updateViewRange = useCallback((start: Date, end: Date) => {
    setCurrentViewRange({ start, end });
  }, []);

  // Performance stats
  const stats = useMemo(() => ({
    totalEvents: events.length,
    visibleEvents: visibleEvents.length,
    performanceGain: events.length > 0 ? 
      Math.round((1 - visibleEvents.length / events.length) * 100) : 0,
    isVirtualized: enableVirtualization && visibleEvents.length < events.length
  }), [events.length, visibleEvents.length, enableVirtualization]);

  return {
    visibleEvents,
    updateViewRange,
    stats,
    eventsByDate
  };
}; 