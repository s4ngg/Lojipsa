package com.s4ngg.loajipsa.workout;

public record WorkoutExerciseResponse(
	Long id,
	String dayOfWeek,
	String muscleGroup,
	String exerciseName,
	int sets,
	int reps,
	Double weightKg,
	int orderIndex
) {
	public static WorkoutExerciseResponse from(WorkoutExercise exercise) {
		return new WorkoutExerciseResponse(exercise.getId(), exercise.getDayOfWeek(), exercise.getMuscleGroup(),
			exercise.getExerciseName(), exercise.getSets(), exercise.getReps(), exercise.getWeightKg(),
			exercise.getOrderIndex());
	}
}
