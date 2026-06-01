import { apiClient } from '../api/apiClient'

export type Exercise = {
  id?: number
  exerciseName: string
  sets: number
  reps: number
  restSeconds: number
}

export type WorkoutPlan = {
  id?: number
  workoutName: string
  muscleGroup: string
  trainingDays: number
  exercises?: Exercise[]
}

export const workoutService = {
  async getWorkouts() {
    const response = await apiClient.get<WorkoutPlan[]>('/workouts')
    return response.data
  },

  async createWorkout(payload: WorkoutPlan) {
    const response = await apiClient.post<WorkoutPlan>('/workouts', payload)
    return response.data
  },

  async getExercises() {
    const response = await apiClient.get<Exercise[]>('/exercises')
    return response.data
  },

  async createExercise(payload: Exercise) {
    const response = await apiClient.post<Exercise>('/exercises', payload)
    return response.data
  },
}
