// import { CreateGoalRequest, Goal, UpdateGoalRequest } from '../types';

// // Function to fetch all goals
// export const fetchGoals = async (): Promise<Goal[]> => {
//   const response = await fetch('/api/goals', {
//     method: 'GET',
//     credentials: 'include', // This ensures cookies are sent with the request
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to fetch goals');
//   }
  
//   return response.json();
// };

// // Function to fetch a single goal by ID
// export const fetchGoalById = async (id: string): Promise<Goal> => {
//   const response = await fetch(`/api/goals/${id}`, {
//     method: 'GET',
//     credentials: 'include',
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to fetch goal');
//   }
  
//   return response.json();
// };

// // Function to create a new goal
// export const createGoal = async (goalData: CreateGoalRequest): Promise<Goal> => {
//   const response = await fetch('/api/goals', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     credentials: 'include',
//     body: JSON.stringify(goalData),
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to create goal');
//   }
  
//   return response.json();
// };

// // Function to update a goal
// export const updateGoal = async (id: string, goalData: Partial<CreateGoalRequest>): Promise<Goal> => {
//   const response = await fetch(`/api/goals/${id}`, {
//     method: 'PATCH',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     credentials: 'include',
//     body: JSON.stringify(goalData),
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to update goal');
//   }
  
//   return response.json();
// };

// // Function to delete a goal
// export const deleteGoal = async (id: string): Promise<void> => {
//   const response = await fetch(`/api/goals/${id}`, {
//     method: 'DELETE',
//     credentials: 'include',
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to delete goal');
//   }
// };

// // Function to toggle goal completion status
// export const toggleGoalComplete = async (id: string): Promise<Goal> => {
//   const response = await fetch(`/api/goals/${id}/toggle-complete`, {
//     method: 'PATCH',
//     credentials: 'include',
//   });
  
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.message || 'Failed to toggle goal completion');
//   }
  
//   return response.json();
// }; 