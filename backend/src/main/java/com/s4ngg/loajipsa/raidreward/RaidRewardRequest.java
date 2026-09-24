package com.s4ngg.loajipsa.raidreward;

public record RaidRewardRequest(
	String raidName,
	String difficulty,
	int minItemLevel,
	int boundGold,
	int tradableGold,
	int weeklyLimitCount
) {
}
