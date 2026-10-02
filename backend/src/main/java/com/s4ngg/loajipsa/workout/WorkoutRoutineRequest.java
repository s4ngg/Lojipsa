package com.s4ngg.loajipsa.workout;

import java.util.List;

public record WorkoutRoutineRequest(
	String title,
	List<WorkoutExerciseInput> exercises
) {
}
