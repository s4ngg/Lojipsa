package com.s4ngg.loajipsa.raidreward;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 주간 골드 계산, 숙제 관리, 원정대 방향성이 공통으로 쓰는 규칙:
 * raidName별로, 주어진 아이템 레벨로 클리어 가능한 것들 중 minItemLevel이 가장 높은
 * (=가장 상위 난이도) 한 줄만 남긴다. 같은 레이드의 여러 난이도를 동시에 계산하지 않기 위함.
 */
public final class RaidEligibility {

	private RaidEligibility() {
	}

	public static List<RaidReward> pickHighestDifficultyPerRaid(List<RaidReward> rewards, double itemAvgLevel) {
		Map<String, RaidReward> byRaidName = new LinkedHashMap<>();
		for (RaidReward r : rewards) {
			if (itemAvgLevel < r.getMinItemLevel()) {
				continue;
			}
			RaidReward existing = byRaidName.get(r.getRaidName());
			if (existing == null || r.getMinItemLevel() > existing.getMinItemLevel()) {
				byRaidName.put(r.getRaidName(), r);
			}
		}
		return List.copyOf(byRaidName.values());
	}

}
