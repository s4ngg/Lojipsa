package com.s4ngg.loajipsa.auth;

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
public class DiscordUser {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String discordId;
	private String discordUsername;
	private String representativeCharacterName;

	public DiscordUser(String discordId, String discordUsername) {
		this.discordId = discordId;
		this.discordUsername = discordUsername;
	}

}
