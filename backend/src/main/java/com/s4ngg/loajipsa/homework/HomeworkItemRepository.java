package com.s4ngg.loajipsa.homework;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomeworkItemRepository extends JpaRepository<HomeworkItem, Long> {
	List<HomeworkItem> findByDiscordUserId(Long discordUserId);

	List<HomeworkItem> findByRosterCharacterId(Long rosterCharacterId);

	void deleteByRosterCharacterId(Long rosterCharacterId);
}
