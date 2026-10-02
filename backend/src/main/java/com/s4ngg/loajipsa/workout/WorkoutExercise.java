package com.s4ngg.loajipsa.workout;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class WorkoutExercise {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long routineId;

	/** "MON".."SUN" */
	private String dayOfWeek;

	private String exerciseName;
	private int sets;
	private int reps;

	/** 맨몸 운동은 무게가 없을 수 있어 nullable. */
	private Double weightKg;

	private int orderIndex;

	public WorkoutExercise(Long routineId, String dayOfWeek, String exerciseName, int sets, int reps,
			Double weightKg, int orderIndex) {
		this.routineId = routineId;
		this.dayOfWeek = dayOfWeek;
		this.exerciseName = exerciseName;
		this.sets = sets;
		this.reps = reps;
		this.weightKg = weightKg;
		this.orderIndex = orderIndex;
	}

}
