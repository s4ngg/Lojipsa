package com.s4ngg.loajipsa.roster;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RosterCharacter {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long discordUserId;
	private String serverName;
	private String characterName;
	private String characterClassName;
	private double itemAvgLevel;
	private Instant lastRefreshedAt;

	/** 캐릭터 개인 초상화 URL(공식 API가 내려주는 CharacterImage). 조회 실패 시 null일 수 있다. */
	@Column(length = 500)
	private String characterImageUrl;

	public RosterCharacter(Long discordUserId, String serverName, String characterName,
			String characterClassName, double itemAvgLevel) {
		this.discordUserId = discordUserId;
		this.serverName = serverName;
		this.characterName = characterName;
		this.characterClassName = characterClassName;
		this.itemAvgLevel = itemAvgLevel;
		this.lastRefreshedAt = Instant.now();
	}

}
