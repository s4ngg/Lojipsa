package com.s4ngg.loajipsa.raidreward;

public record RaidRewardResponse(
	Long id,
	String raidName,
	String difficulty,
	int minItemLevel,
	int boundGold,
	int tradableGold,
	int weeklyLimitCount
) {

	public static RaidRewardResponse from(RaidReward entity) {
		return new RaidRewardResponse(
			entity.getId(),
			entity.getRaidName(),
			entity.getDifficulty(),
			entity.getMinItemLevel(),
			entity.getBoundGold(),
			entity.getTradableGold(),
			entity.getWeeklyLimitCount()
		);
	}

}
