package com.s4ngg.loajipsa.workout;

public record WorkoutExerciseInput(
	String dayOfWeek,
	String exerciseName,
	int sets,
	int reps,
	Double weightKg
) {
}
