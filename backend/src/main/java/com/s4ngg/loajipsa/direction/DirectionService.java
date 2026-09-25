package com.s4ngg.loajipsa.direction;

import com.s4ngg.loajipsa.anthropic.AnthropicClient;
import com.s4ngg.loajipsa.auth.DiscordUser;
import com.s4ngg.loajipsa.auth.DiscordUserRepository;
import com.s4ngg.loajipsa.raidreward.RaidEligibility;
import com.s4ngg.loajipsa.raidreward.RaidReward;
import com.s4ngg.loajipsa.raidreward.RaidRewardRepository;
import com.s4ngg.loajipsa.roster.RosterCharacter;
import com.s4ngg.loajipsa.roster.RosterCharacterRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DirectionService {

	private final RosterCharacterRepository rosterCharacterRepository;
	private final RaidRewardRepository raidRewardRepository;
	private final DiscordUserRepository userRepository;
	private final RecommendationContextRepository contextRepository;
	private final AnthropicClient anthropicClient;

	public DirectionService(RosterCharacterRepository rosterCharacterRepository, RaidRewardRepository raidRewardRepository,
			DiscordUserRepository userRepository, RecommendationContextRepository contextRepository,
			AnthropicClient anthropicClient) {
		this.rosterCharacterRepository = rosterCharacterRepository;
		this.raidRewardRepository = raidRewardRepository;
		this.userRepository = userRepository;
		this.contextRepository = contextRepository;
		this.anthropicClient = anthropicClient;
	}

	public DirectionResponse recommend(String discordId, DirectionRequest request) {
		DiscordUser user = findUser(discordId);
		RosterCharacter character = rosterCharacterRepository.findById(request.characterId())
			.filter(c -> c.getDiscordUserId().equals(user.getId()))
			.orElseThrow(() -> new NoSuchElementException("캐릭터를 찾을 수 없습니다: " + request.characterId()));

		List<RaidReward> allRewards = raidRewardRepository.findAll();
		if (allRewards.isEmpty()) {
			throw new IllegalStateException("등록된 레이드 보상 정보가 없어 계산할 수 없습니다");
		}

		int currentWeeklyTradableGold = tradableGoldAt(allRewards, character.getItemAvgLevel());

		int targetItemLevel = request.targetItemLevel() != null
			? request.targetItemLevel()
			: allRewards.stream().mapToInt(RaidReward::getMinItemLevel).max().orElse((int) character.getItemAvgLevel());

		int targetWeeklyTradableGold = tradableGoldAt(allRewards, targetItemLevel);
		int weeklyGoldGain = targetWeeklyTradableGold - currentWeeklyTradableGold;

		String context = contextRepository.findById(1L).map(RecommendationContext::getContent).orElse("");

		String recommendation = buildRecommendation(character, currentWeeklyTradableGold, targetItemLevel,
			targetWeeklyTradableGold, weeklyGoldGain, request.honingCostGold(), context);

		return new DirectionResponse(character.getCharacterName(), character.getItemAvgLevel(),
			currentWeeklyTradableGold, targetItemLevel, targetWeeklyTradableGold, weeklyGoldGain,
			request.honingCostGold(), recommendation);
	}

	private int tradableGoldAt(List<RaidReward> rewards, double itemLevel) {
		return RaidEligibility.pickHighestDifficultyPerRaid(rewards, itemLevel).stream()
			.mapToInt(RaidReward::getTradableGold)
			.sum();
	}

	private String buildRecommendation(RosterCharacter character, int currentGold, int targetLevel,
			int targetGold, int goldGain, int honingCost, String context) {
		String prompt = """
			너는 로스트아크(MMORPG) 육성 전략을 조언하는 어시스턴트다. 아래 캐릭터의 상황을 보고,
			지금 무리해서라도 강화를 진행하는 게 나은지, 아니면 당분간 현재 레벨에서 "주차"하며
			골드를 모으다가 나중에 강화하는 게 나은지 판단해서 한국어로 3~5문장 추천해줘.
			추천 이유를 함께 설명하고, 주차를 권한다면 대략 몇 주 정도가 적당해 보이는지도 언급해줘.
			인사말이나 서론 없이 바로 추천 내용만 말해줘.

			캐릭터: %s (현재 아이템 레벨 %.2f)
			현재 레벨 기준 주간 거래 가능 골드: %d골드
			목표 아이템 레벨: %d
			목표 레벨 도달 시 주간 거래 가능 골드: %d골드 (주당 %+d골드 변화)
			목표 레벨까지 예상 강화 비용: %d골드
			%s
			""".formatted(
			character.getCharacterName(), character.getItemAvgLevel(),
			currentGold, targetLevel, targetGold, goldGain, honingCost,
			context.isBlank() ? "" : "추가로 참고할 게임 시스템 정보:\n" + context
		);

		return anthropicClient.complete(prompt, 400)
			.orElse("AI 추천을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
	}

	private DiscordUser findUser(String discordId) {
		return userRepository.findByDiscordId(discordId)
			.orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + discordId));
	}

}
