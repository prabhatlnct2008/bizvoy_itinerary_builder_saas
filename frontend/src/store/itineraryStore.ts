import { create } from 'zustand';
import { ItineraryDetail, ItineraryDayCreate, ItineraryDayActivityCreate } from '../types';

interface ItineraryState {
  currentItinerary: ItineraryDetail | null;
  days: ItineraryDayCreate[];
  hasUnsavedChanges: boolean;

  // Actions
  setItinerary: (itinerary: ItineraryDetail) => void;
  setDays: (days: ItineraryDayCreate[]) => void;
  updateDay: (dayIndex: number, updates: Partial<ItineraryDayCreate>) => void;
  addActivityToDay: (dayIndex: number, activity: ItineraryDayActivityCreate) => void;
  removeActivityFromDay: (dayIndex: number, activityIndex: number) => void;
  moveActivity: (dayIndex: number, activityIndex: number, direction: 'up' | 'down') => void;
  updateActivity: (
    dayIndex: number,
    activityIndex: number,
    updates: Partial<ItineraryDayActivityCreate>
  ) => void;
  clearItinerary: () => void;
  markSaved: () => void;
}

export const useItineraryStore = create<ItineraryState>((set) => ({
  currentItinerary: null,
  days: [],
  hasUnsavedChanges: false,

  setItinerary: (itinerary) => {
    const days: ItineraryDayCreate[] = itinerary.days.map((day) => ({
      day_number: day.day_number,
      actual_date: day.actual_date,
      title: day.title || null,
      notes: day.notes || null,
      activities: day.activities.map((act) => ({
        activity_id: act.activity_id,
        display_order: act.display_order,
        time_slot: act.time_slot,
        custom_notes: act.custom_notes,
        custom_price: act.custom_price,
      })),
    }));

    set({ currentItinerary: itinerary, days, hasUnsavedChanges: false });
  },

  setDays: (days) => set({ days, hasUnsavedChanges: true }),

  updateDay: (dayIndex, updates) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex] = { ...newDays[dayIndex], ...updates };
      return { days: newDays, hasUnsavedChanges: true };
    }),

  addActivityToDay: (dayIndex, activity) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex].activities.push(activity);
      return { days: newDays, hasUnsavedChanges: true };
    }),

  removeActivityFromDay: (dayIndex, activityIndex) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex].activities.splice(activityIndex, 1);
      // Reorder remaining activities
      newDays[dayIndex].activities.forEach((act, idx) => {
        act.display_order = idx;
      });
      return { days: newDays, hasUnsavedChanges: true };
    }),

  moveActivity: (dayIndex, activityIndex, direction) =>
    set((state) => {
      const newDays = [...state.days];
      const activities = newDays[dayIndex].activities;
      const newIndex = direction === 'up' ? activityIndex - 1 : activityIndex + 1;

      if (newIndex < 0 || newIndex >= activities.length) return state;

      // Swap activities
      [activities[activityIndex], activities[newIndex]] = [
        activities[newIndex],
        activities[activityIndex],
      ];

      // Update display_order
      activities.forEach((act, idx) => {
        act.display_order = idx;
      });

      return { days: newDays, hasUnsavedChanges: true };
    }),

  updateActivity: (dayIndex, activityIndex, updates) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex].activities[activityIndex] = {
        ...newDays[dayIndex].activities[activityIndex],
        ...updates,
      };
      return { days: newDays, hasUnsavedChanges: true };
    }),

  clearItinerary: () =>
    set({ currentItinerary: null, days: [], hasUnsavedChanges: false }),

  markSaved: () => set({ hasUnsavedChanges: false }),
}));
