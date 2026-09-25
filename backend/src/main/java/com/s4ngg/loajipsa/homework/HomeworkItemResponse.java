package com.s4ngg.loajipsa.homework;

public record HomeworkItemResponse(
	Long id,
	Long characterId,
	String characterName,
	String serverName,
	String raidName,
	String difficulty,
	int boundGold,
	int tradableGold,
	boolean completedThisWeek
) {
}
