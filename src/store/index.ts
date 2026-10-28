import { configureStore } from '@reduxjs/toolkit';
import goals from './goalsSlice';
import reminders from './remindersSlice';
import settings from './settingsSlice';
import workouts from './workoutsSlice';

export const store = configureStore({ reducer: { workouts, goals, reminders, settings } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
