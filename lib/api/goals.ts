import { CreateGoalRequest, Goal, UpdateGoalRequest } from '../types';

// lib/goalsApi.ts (or wherever this lives)

import api from '@/lib/apiClient'; // 👈 Axios instance with interceptor

// Fetch all goals
export const fetchGoals = async (): Promise<Goal[]> => {
  const { data } = await api.get('/goals');
  return data;
};

// Fetch goal by ID
export const fetchGoalById = async (id: string): Promise<Goal> => {
  const { data } = await api.get(`/goals/${id}`);
  return data;
};

// Create a new goal
export const createGoal = async (goalData: CreateGoalRequest): Promise<Goal> => {
  const { data } = await api.post('/goals', goalData);
  return data;
};

// Update a goal
export const updateGoal = async (id: string, goalData: Partial<CreateGoalRequest>): Promise<Goal> => {
  const { data } = await api.patch(`/goals/${id}`, goalData);
  return data;
};

// Delete a goal
export const deleteGoal = async (id: string): Promise<void> => {
  await api.delete(`/goals/${id}`);
};

// Toggle goal complete
export const toggleGoalComplete = async (id: string): Promise<Goal> => {
  const { data } = await api.patch(`/goals/${id}/toggle-complete`);
  return data;
};
