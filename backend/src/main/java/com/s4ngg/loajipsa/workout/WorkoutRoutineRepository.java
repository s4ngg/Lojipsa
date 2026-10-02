package com.s4ngg.loajipsa.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutRoutineRepository extends JpaRepository<WorkoutRoutine, Long> {
	List<WorkoutRoutine> findByDiscordUserId(Long discordUserId);
}
