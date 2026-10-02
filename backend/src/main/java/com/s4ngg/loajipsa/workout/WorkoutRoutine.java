package com.s4ngg.loajipsa.workout;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class WorkoutRoutine {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long discordUserId;
	private String title;

	@Lob
	@Column(length = 4000)
	private String lastFeedback;

	private Instant lastFeedbackAt;
	private Instant createdAt;
	private Instant updatedAt;

	public WorkoutRoutine(Long discordUserId, String title) {
		this.discordUserId = discordUserId;
		this.title = title;
		this.createdAt = Instant.now();
		this.updatedAt = Instant.now();
	}

}
