package com.s4ngg.loajipsa.direction;

public record DirectionResponse(
	String characterName,
	double currentItemLevel,
	int currentWeeklyTradableGold,
	int targetItemLevel,
	int targetWeeklyTradableGold,
	int weeklyGoldGain,
	int honingCostGold,
	String recommendation
) {
}
