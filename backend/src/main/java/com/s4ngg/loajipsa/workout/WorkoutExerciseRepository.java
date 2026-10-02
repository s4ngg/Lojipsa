package com.s4ngg.loajipsa.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutExerciseRepository extends JpaRepository<WorkoutExercise, Long> {
	List<WorkoutExercise> findByRoutineIdOrderByOrderIndexAsc(Long routineId);
	void deleteByRoutineId(Long routineId);
}
