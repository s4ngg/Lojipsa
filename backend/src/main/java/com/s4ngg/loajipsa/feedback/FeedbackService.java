package com.s4ngg.loajipsa.feedback;

import com.s4ngg.loajipsa.anthropic.AnthropicClient;
import com.s4ngg.loajipsa.direction.DirectionRequest;
import com.s4ngg.loajipsa.direction.DirectionResponse;
import com.s4ngg.loajipsa.direction.DirectionService;
import com.s4ngg.loajipsa.direction.RecommendationContext;
import com.s4ngg.loajipsa.direction.RecommendationContextRepository;
import com.s4ngg.loajipsa.raidreward.RaidReward;
import com.s4ngg.loajipsa.raidreward.RaidRewardRepository;
import com.s4ngg.loajipsa.roster.RosterCharacter;
import com.s4ngg.loajipsa.slack.SlackNotifier;
import com.s4ngg.loajipsa.status.ActivityLogStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * 실제 유저 없이 합성 시나리오로 원정대 방향성 추천을 실행해보고, 그 결과를 다시 Claude에게
 * 채점시켜서 운영 품질을 스스로 점검하는 에이전트. 레이드 보상·배경지식은 운영 중인 실제 데이터를
 * 그대로 쓰고, 캐릭터만 합성(DB에 저장하지 않음)이다 — 실제 유저 데이터에는 손대지 않는다.
 */
@Slf4j
@Service
public class FeedbackService {

	private final DirectionService directionService;
	private final RaidRewardRepository raidRewardRepository;
	private final RecommendationContextRepository contextRepository;
	private final AnthropicClient anthropicClient;
	private final SlackNotifier slackNotifier;
	private final ActivityLogStore activityLogStore;

	public FeedbackService(DirectionService directionService, RaidRewardRepository raidRewardRepository,
			RecommendationContextRepository contextRepository, AnthropicClient anthropicClient,
			SlackNotifier slackNotifier, ActivityLogStore activityLogStore) {
		this.directionService = directionService;
		this.raidRewardRepository = raidRewardRepository;
		this.contextRepository = contextRepository;
		this.anthropicClient = anthropicClient;
		this.slackNotifier = slackNotifier;
		this.activityLogStore = activityLogStore;
	}

	public void runDirectionCheck() {
		List<RaidReward> rewards = raidRewardRepository.findAll();
		if (rewards.isEmpty()) {
			log.warn("레이드 보상 정보가 없어 피드백 점검을 건너뜁니다.");
			return;
		}

		String context = contextRepository.findById(1L).map(RecommendationContext::getContent).orElse("");
		// targetItemLevel을 null로 두면 DirectionService가 "등록된 레이드 중 최고 요구 레벨"을
		// 목표로 잡는데, 실제 운영 데이터에 어떤 레이드가 있느냐에 따라 목표가 현재 레벨(1680)보다
		// 낮아져서 앞뒤가 안 맞는 시나리오가 될 수 있다(로컬 테스트로 실제 발견) — 그래서 항상
		// 현재보다 높은 목표를 명시해 시나리오 자체는 운영 데이터와 무관하게 항상 앞뒤가 맞게 한다.
		RosterCharacter scenario = new RosterCharacter(0L, "테스트서버", "피드백테스트캐릭터", "버서커", 1680.0);
		DirectionRequest request = new DirectionRequest(null, 50_000_000, 1700);

		long start = System.currentTimeMillis();
		DirectionResponse response;
		try {
			response = directionService.recommend(scenario, rewards, request, context);
		}
		catch (Exception e) {
			log.error("원정대 방향성 점검용 호출 실패", e);
			String message = "🔴 피드백 점검(원정대 방향성): 실행 자체가 실패했습니다 — " + e.getMessage();
			slackNotifier.send(message);
			activityLogStore.append(message);
			return;
		}
		long elapsedMs = System.currentTimeMillis() - start;

		if (response.recommendation().startsWith("AI 추천을 가져오지 못했습니다")) {
			String message = "🔴 피드백 점검(원정대 방향성): 추천 생성 자체가 실패(Claude 응답 없음), %dms".formatted(elapsedMs);
			slackNotifier.send(message);
			activityLogStore.append(message);
			return;
		}

		Optional<String> verdict = judge(response, context);
		// PASS/FAIL은 채점이 실제로 이뤄졌을 때의 결과고, 채점 호출 자체가 실패한 경우는 별개의
		// "판정 보류" 상태다 — 이걸 정상(PASS)으로 뭉뚱그리면 진짜 이상 상황을 놓칠 수 있다.
		String icon;
		String label;
		if (verdict.isEmpty()) {
			icon = "🟡";
			label = "판정 보류(채점 호출 실패)";
		}
		else if (verdict.get().toUpperCase().startsWith("FAIL")) {
			icon = "🔴";
			label = "이상 감지";
		}
		else {
			icon = "🟢";
			label = "정상";
		}

		String message = "%s 피드백 점검(원정대 방향성) — %s (%dms)\n판정: %s"
			.formatted(icon, label, elapsedMs, verdict.orElse("Claude 채점 호출 응답 없음"));
		slackNotifier.send(message);
		activityLogStore.append(message);
	}

	private Optional<String> judge(DirectionResponse response, String context) {
		String judgePrompt = """
			아래는 로스트아크 육성 방향(밀기 vs 주차) 추천 AI가 실제로 낸 답변이다. 입력 숫자와
			모순되지 않는지, 배경지식을 무시하거나 없는 내용을 지어내지 않았는지, 3~5문장 분량과
			어조 지침(인사말/서론 없이 추천 내용만)을 지켰는지 확인해라. "PASS" 또는 "FAIL" 중
			하나로 먼저 답하고, 이어서 한 문장으로 이유를 설명해라. 다른 말은 붙이지 마라.

			[입력 숫자]
			현재 아이템 레벨: %.2f, 현재 주간 거래 가능 골드: %d
			목표 아이템 레벨: %d, 목표 주간 거래 가능 골드: %d (주당 %+d골드 변화)
			예상 강화 비용: %d골드
			배경지식: %s

			[AI 답변]
			%s
			""".formatted(
			response.currentItemLevel(), response.currentWeeklyTradableGold(),
			response.targetItemLevel(), response.targetWeeklyTradableGold(), response.weeklyGoldGain(),
			response.honingCostGold(), context.isBlank() ? "(없음)" : context,
			response.recommendation()
		);

		// 더 상위 모델을 채점에 써보려 했으나, 이 프롬프트에서 내부적으로 "thinking" 블록만
		// 반환하고 정작 텍스트 답변은 안 내는 경우를 로컬 테스트로 확인했다(토큰을 늘려도 동일).
		// 앱 전체에서 이미 안정적으로 동작 중인 기본 모델(Haiku)로 채점한다.
		return anthropicClient.complete(judgePrompt, 400);
	}

}
