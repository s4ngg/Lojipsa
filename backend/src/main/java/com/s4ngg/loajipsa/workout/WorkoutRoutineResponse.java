package com.s4ngg.loajipsa.workout;

import java.time.Instant;
import java.util.List;

public record WorkoutRoutineResponse(
	Long id,
	String title,
	List<WorkoutExerciseResponse> exercises,
	String lastFeedback,
	Instant lastFeedbackAt,
	Instant updatedAt
) {
}
