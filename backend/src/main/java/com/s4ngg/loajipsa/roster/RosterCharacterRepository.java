package com.s4ngg.loajipsa.roster;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RosterCharacterRepository extends JpaRepository<RosterCharacter, Long> {
	List<RosterCharacter> findByDiscordUserId(Long discordUserId);

	void deleteByDiscordUserId(Long discordUserId);
}
