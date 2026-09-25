package com.s4ngg.loajipsa.direction;

public record DirectionRequest(
	Long characterId,
	int honingCostGold,
	Integer targetItemLevel
) {
}
