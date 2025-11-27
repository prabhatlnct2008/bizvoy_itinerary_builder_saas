import { create } from 'zustand';
import { TemplateDetail, TemplateDayCreate, TemplateDayActivityCreate } from '../types';

interface TemplateState {
  currentTemplate: TemplateDetail | null;
  days: TemplateDayCreate[];
  selectedDayIndex: number;
  hasUnsavedChanges: boolean;

  // Actions
  setTemplate: (template: TemplateDetail) => void;
  setDays: (days: TemplateDayCreate[]) => void;
  setSelectedDayIndex: (index: number) => void;
  updateDay: (dayIndex: number, updates: Partial<TemplateDayCreate>) => void;

  // Day Management Actions
  addDay: () => void;
  deleteDay: (dayIndex: number) => void;
  duplicateDay: (dayIndex: number) => void;
  reorderDays: (startIndex: number, endIndex: number) => void;
  renameDay: (dayIndex: number, newTitle: string) => void;

  // Activity Actions
  addActivityToDay: (dayIndex: number, activity: TemplateDayActivityCreate) => void;
  removeActivityFromDay: (dayIndex: number, activityIndex: number) => void;
  moveActivity: (dayIndex: number, activityIndex: number, direction: 'up' | 'down') => void;
  updateActivity: (
    dayIndex: number,
    activityIndex: number,
    updates: Partial<TemplateDayActivityCreate>
  ) => void;
  reorderActivities: (dayIndex: number, startIndex: number, endIndex: number) => void;
  clearTemplate: () => void;
  markSaved: () => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  currentTemplate: null,
  days: [],
  selectedDayIndex: 0,
  hasUnsavedChanges: false,

  setTemplate: (template) => {
    const days: TemplateDayCreate[] = template.days.map((day) => ({
      day_number: day.day_number,
      title: day.title || null,
      notes: day.notes || null,
      activities: day.activities.map((act) => ({
        activity_id: act.activity_id,
        display_order: act.display_order,
        time_slot: act.time_slot,
        custom_notes: act.custom_notes,
      })),
    }));

    set({ currentTemplate: template, days, hasUnsavedChanges: false, selectedDayIndex: 0 });
  },

  setDays: (days) => set({ days, hasUnsavedChanges: true }),

  setSelectedDayIndex: (index) => set({ selectedDayIndex: index }),

  updateDay: (dayIndex, updates) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex] = { ...newDays[dayIndex], ...updates };
      return { days: newDays, hasUnsavedChanges: true };
    }),

  // Day Management Actions
  addDay: () =>
    set((state) => {
      const newDayNumber = state.days.length + 1;
      const newDay: TemplateDayCreate = {
        day_number: newDayNumber,
        title: `Day ${newDayNumber}`,
        notes: null,
        activities: [],
      };
      return {
        days: [...state.days, newDay],
        hasUnsavedChanges: true,
      };
    }),

  deleteDay: (dayIndex) =>
    set((state) => {
      if (state.days.length <= 1) {
        return state; // Don't delete the last day
      }
      const newDays = state.days.filter((_, idx) => idx !== dayIndex);
      // Renumber days
      newDays.forEach((day, idx) => {
        day.day_number = idx + 1;
      });
      // Adjust selected day index if needed
      let newSelectedIndex = state.selectedDayIndex;
      if (newSelectedIndex >= newDays.length) {
        newSelectedIndex = newDays.length - 1;
      }
      return {
        days: newDays,
        selectedDayIndex: newSelectedIndex,
        hasUnsavedChanges: true,
      };
    }),

  duplicateDay: (dayIndex) =>
    set((state) => {
      const dayToDuplicate = state.days[dayIndex];
      const newDay: TemplateDayCreate = {
        day_number: state.days.length + 1,
        title: `${dayToDuplicate.title || 'Day'} (Copy)`,
        notes: dayToDuplicate.notes,
        activities: dayToDuplicate.activities.map((act) => ({ ...act })),
      };
      return {
        days: [...state.days, newDay],
        hasUnsavedChanges: true,
      };
    }),

  reorderDays: (startIndex, endIndex) =>
    set((state) => {
      const newDays = [...state.days];
      const [removed] = newDays.splice(startIndex, 1);
      newDays.splice(endIndex, 0, removed);
      // Renumber days
      newDays.forEach((day, idx) => {
        day.day_number = idx + 1;
      });
      // Update selected index to follow the moved day if it was selected
      let newSelectedIndex = state.selectedDayIndex;
      if (state.selectedDayIndex === startIndex) {
        newSelectedIndex = endIndex;
      } else if (startIndex < state.selectedDayIndex && endIndex >= state.selectedDayIndex) {
        newSelectedIndex = state.selectedDayIndex - 1;
      } else if (startIndex > state.selectedDayIndex && endIndex <= state.selectedDayIndex) {
        newSelectedIndex = state.selectedDayIndex + 1;
      }
      return {
        days: newDays,
        selectedDayIndex: newSelectedIndex,
        hasUnsavedChanges: true,
      };
    }),

  renameDay: (dayIndex, newTitle) =>
    set((state) => {
      const newDays = [...state.days];
      newDays[dayIndex] = { ...newDays[dayIndex], title: newTitle || null };
      return { days: newDays, hasUnsavedChanges: true };
    }),

  addActivityToDay: (dayIndex, activity) =>
    set((state) => {
      const newDays = [...state.days];
      // Check if activity already exists
      const exists = newDays[dayIndex].activities.some(
        (act) => act.activity_id === activity.activity_id
      );
      if (exists) {
        return state; // Don't add duplicate
      }
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

  reorderActivities: (dayIndex, startIndex, endIndex) =>
    set((state) => {
      const newDays = [...state.days];
      const activities = [...newDays[dayIndex].activities];
      const [removed] = activities.splice(startIndex, 1);
      activities.splice(endIndex, 0, removed);

      // Update display_order for all activities
      activities.forEach((act, idx) => {
        act.display_order = idx;
      });

      newDays[dayIndex].activities = activities;
      return { days: newDays, hasUnsavedChanges: true };
    }),

  clearTemplate: () =>
    set({ currentTemplate: null, days: [], selectedDayIndex: 0, hasUnsavedChanges: false }),

  markSaved: () => set({ hasUnsavedChanges: false }),
}));
