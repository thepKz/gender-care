# Calendar Utils API Integration Guide

## 📋 Overview

File `doctorCalendarUtils.ts` đã được fix để tương thích với API structure mới sau restructure.

## 🔧 Changes Made

### **1. Import Path Fixed**
```typescript
// ❌ Old (broken after restructure)
import { IDoctorSchedule, IWeekScheduleObject, ITimeSlot } from '../api/endpoints/doctorApi';

// ✅ New (working)
import { DoctorSchedule } from '../api/endpoints/doctorApi';
```

### **2. Interface Definitions**
Tạo interfaces riêng cho calendar utils vì structure khác với API:

```typescript
export interface ITimeSlot {
  _id: string;
  slotTime: string;
  status: 'Free' | 'Booked' | 'Absent';
}

export interface IWeekScheduleObject {
  _id: string;
  dayOfWeek: string;
  slots: ITimeSlot[];
}

export interface IDoctorSchedule {
  _id: string;
  doctorId: {
    _id: string;
    userId: {
      fullName: string;
    };
  };
  weekSchedule: IWeekScheduleObject[];
}
```

## 🚀 Usage Examples

### **Basic Usage**
```typescript
import doctorCalendarUtils from '@/utils/doctorCalendarUtils';
import { doctorApi } from '@/api/endpoints/doctorApi';

// Lấy schedule từ API
const schedules = await doctorApi.getDoctorSchedules(doctorId);

// Convert to calendar events
const events = doctorCalendarUtils.convertDoctorSchedulesToCalendarEvents([schedules]);

// Get statistics
const stats = doctorCalendarUtils.getDoctorScheduleStats([schedules]);
```

### **Integration với React Components**
```typescript
import { useEffect, useState } from 'react';
import doctorCalendarUtils, { DoctorCalendarEvent } from '@/utils/doctorCalendarUtils';
import { doctorApi } from '@/api';

const DoctorCalendar = ({ doctorId }: { doctorId: string }) => {
  const [events, setEvents] = useState<DoctorCalendarEvent[]>([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const schedules = await doctorApi.getDoctorSchedules(doctorId);
        
        // Convert to calendar events
        const calendarEvents = doctorCalendarUtils
          .convertDoctorSchedulesToCalendarEvents([schedules]);
        
        // Get statistics
        const scheduleStats = doctorCalendarUtils
          .getDoctorScheduleStats([schedules]);
        
        setEvents(calendarEvents);
        setStats(scheduleStats);
      } catch (error) {
        console.error('Error fetching doctor schedules:', error);
      }
    };

    fetchSchedules();
  }, [doctorId]);

  return (
    <div>
      {/* Render calendar với events */}
      {/* Render stats */}
    </div>
  );
};
```

## 🔄 Data Flow

```
API Response (DoctorSchedule)
        ↓
doctorCalendarUtils.convertDoctorSchedulesToCalendarEvents()
        ↓
Calendar Events (DoctorCalendarEvent[])
        ↓
React Calendar Component
```

## 📊 Available Functions

### **Event Conversion**
- `convertDoctorSchedulesToCalendarEvents()`: Convert API data to calendar events
- `groupEventsByDate()`: Group events by date
- `getEventsForDate()`: Get events for specific date

### **Statistics**
- `getDoctorScheduleStats()`: Overall statistics
- `getTodayStats()`: Today's statistics only
- `getStatusDistribution()`: Status distribution for date range

### **Utility Functions**
- `getTimeSlotsForDate()`: Get time slots for specific date
- `isDoctorAvailable()`: Check doctor availability
- `hasEventsOnDate()`: Check if date has events
- `getUpcomingEvents()`: Get upcoming events

## 🚨 Important Notes

### **Data Structure Mismatch**
- **API `DoctorSchedule.doctorId`**: `string`
- **Calendar `IDoctorSchedule.doctorId`**: `object with userId.fullName`

Calendar utils cần expanded doctor info để hiển thị tên. Khi sử dụng, cần combine data từ multiple API calls hoặc modify API response.

### **Recommended Pattern**
```typescript
// Option 1: Combine API calls
const doctor = await doctorApi.getDoctorById(doctorId);
const schedule = await doctorApi.getDoctorSchedules(doctorId);

// Transform to calendar format
const calendarSchedule: IDoctorSchedule = {
  ...schedule,
  doctorId: {
    _id: doctor._id,
    userId: {
      fullName: doctor.userId.fullName
    }
  }
};

// Option 2: Request enhanced API endpoint
// API team can modify endpoint to include doctor details
```

## 🎯 Best Practices

1. **Type Safety**: Always use exported interfaces
2. **Error Handling**: Wrap API calls in try-catch
3. **Data Validation**: Validate API response structure
4. **Performance**: Cache schedule data when possible
5. **Loading States**: Show loading while fetching data

## 🔧 Future Improvements

1. **API Enhancement**: Include doctor details in schedule endpoint
2. **Caching**: Implement schedule caching mechanism
3. **Real-time Updates**: WebSocket integration for live updates
4. **Optimistic Updates**: Update UI immediately, sync with server

---

*Updated: 2025-01-27*  
*Fixed post-restructure API integration* 