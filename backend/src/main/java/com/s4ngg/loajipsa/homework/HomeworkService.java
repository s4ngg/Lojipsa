package com.s4ngg.loajipsa.homework;

import com.s4ngg.loajipsa.auth.DiscordUser;
import com.s4ngg.loajipsa.auth.DiscordUserRepository;
import com.s4ngg.loajipsa.raidreward.RaidEligibility;
import com.s4ngg.loajipsa.raidreward.RaidReward;
import com.s4ngg.loajipsa.raidreward.RaidRewardRepository;
import com.s4ngg.loajipsa.roster.RosterCharacter;
import com.s4ngg.loajipsa.roster.RosterCharacterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class HomeworkService {

	// 로스트아크 주간 초기화 시점(수요일 오전 6시, KST) 기준으로 "이번 주 완료 여부"를 계산한다.
	// 별도 초기화 스케줄러 없이, 조회 시점마다 이 기준선과 lastCompletedAt을 비교하는 방식.
	private static final ZoneId RESET_ZONE = ZoneId.of("Asia/Seoul");
	private static final DayOfWeek RESET_DAY = DayOfWeek.WEDNESDAY;
	private static final int RESET_HOUR = 6;

	private final HomeworkItemRepository homeworkRepository;
	private final RosterCharacterRepository rosterCharacterRepository;
	private final RaidRewardRepository raidRewardRepository;
	private final DiscordUserRepository userRepository;

	public HomeworkService(HomeworkItemRepository homeworkRepository, RosterCharacterRepository rosterCharacterRepository,
			RaidRewardRepository raidRewardRepository, DiscordUserRepository userRepository) {
		this.homeworkRepository = homeworkRepository;
		this.rosterCharacterRepository = rosterCharacterRepository;
		this.raidRewardRepository = raidRewardRepository;
		this.userRepository = userRepository;
	}

	public List<HomeworkItemResponse> list(String discordId) {
		DiscordUser user = findUser(discordId);
		List<HomeworkItem> items = homeworkRepository.findByDiscordUserId(user.getId());
		Map<Long, RosterCharacter> charactersById = rosterCharacterRepository.findByDiscordUserId(user.getId())
			.stream()
			.collect(Collectors.toMap(RosterCharacter::getId, c -> c));
		List<RaidReward> allRewards = raidRewardRepository.findAll();
		return items.stream().map(item -> toResponse(item, charactersById.get(item.getRosterCharacterId()), allRewards)).toList();
	}

	@Transactional
	public List<HomeworkItemResponse> setup(String discordId, HomeworkSetupRequest request) {
		DiscordUser user = findUser(discordId);
		RosterCharacter character = rosterCharacterRepository.findById(request.characterId())
			.filter(c -> c.getDiscordUserId().equals(user.getId()))
			.orElseThrow(() -> new NoSuchElementException("캐릭터를 찾을 수 없습니다: " + request.characterId()));

		List<RaidReward> allRewards = raidRewardRepository.findAll();
		List<HomeworkItem> newItems = request.mode() == HomeworkSetupMode.MANUAL
			? buildManualItems(user.getId(), character.getId(), request, allRewards)
			: buildAutoItems(user.getId(), character, request.mode(), allRewards);

		homeworkRepository.deleteByRosterCharacterId(character.getId());
		List<HomeworkItem> saved = homeworkRepository.saveAll(newItems);
		return saved.stream().map(item -> toResponse(item, character, allRewards)).toList();
	}

	@Transactional
	public HomeworkItemResponse toggle(String discordId, Long itemId) {
		DiscordUser user = findUser(discordId);
		HomeworkItem item = homeworkRepository.findById(itemId)
			.filter(i -> i.getDiscordUserId().equals(user.getId()))
			.orElseThrow(() -> new NoSuchElementException("체크리스트 항목을 찾을 수 없습니다: " + itemId));

		item.setLastCompletedAt(isCompletedThisWeek(item.getLastCompletedAt()) ? null : Instant.now());
		HomeworkItem saved = homeworkRepository.save(item);

		RosterCharacter character = rosterCharacterRepository.findById(saved.getRosterCharacterId()).orElse(null);
		return toResponse(saved, character, raidRewardRepository.findAll());
	}

	public void delete(String discordId, Long itemId) {
		DiscordUser user = findUser(discordId);
		HomeworkItem item = homeworkRepository.findById(itemId)
			.filter(i -> i.getDiscordUserId().equals(user.getId()))
			.orElseThrow(() -> new NoSuchElementException("체크리스트 항목을 찾을 수 없습니다: " + itemId));
		homeworkRepository.delete(item);
	}

	private List<HomeworkItem> buildManualItems(Long discordUserId, Long characterId, HomeworkSetupRequest request,
			List<RaidReward> allRewards) {
		if (request.manualSelections() == null || request.manualSelections().isEmpty()) {
			throw new IllegalArgumentException("수동 설정에는 최소 1개 이상의 레이드를 선택해야 합니다");
		}
		return request.manualSelections().stream().map(sel -> {
			boolean exists = allRewards.stream()
				.anyMatch(r -> r.getRaidName().equals(sel.raidName()) && r.getDifficulty().equals(sel.difficulty()));
			if (!exists) {
				throw new IllegalArgumentException("등록되지 않은 레이드입니다: " + sel.raidName() + " " + sel.difficulty());
			}
			return newItem(discordUserId, characterId, sel.raidName(), sel.difficulty());
		}).toList();
	}

	private List<HomeworkItem> buildAutoItems(Long discordUserId, RosterCharacter character, HomeworkSetupMode mode,
			List<RaidReward> allRewards) {
		List<RaidReward> eligible = RaidEligibility.pickHighestDifficultyPerRaid(allRewards, character.getItemAvgLevel());
		Comparator<RaidReward> byGoldDesc = mode == HomeworkSetupMode.AUTO_TRADABLE_ONLY
			? Comparator.comparingInt(RaidReward::getTradableGold).reversed()
			: Comparator.comparingInt((RaidReward r) -> r.getBoundGold() + r.getTradableGold()).reversed();

		return eligible.stream()
			.sorted(byGoldDesc)
			.map(r -> newItem(discordUserId, character.getId(), r.getRaidName(), r.getDifficulty()))
			.toList();
	}

	private HomeworkItem newItem(Long discordUserId, Long characterId, String raidName, String difficulty) {
		HomeworkItem item = new HomeworkItem();
		item.setDiscordUserId(discordUserId);
		item.setRosterCharacterId(characterId);
		item.setRaidName(raidName);
		item.setDifficulty(difficulty);
		return item;
	}

	private HomeworkItemResponse toResponse(HomeworkItem item, RosterCharacter character, List<RaidReward> allRewards) {
		RaidReward matched = allRewards.stream()
			.filter(r -> r.getRaidName().equals(item.getRaidName()) && r.getDifficulty().equals(item.getDifficulty()))
			.findFirst()
			.orElse(null);
		return new HomeworkItemResponse(
			item.getId(),
			item.getRosterCharacterId(),
			character != null ? character.getCharacterName() : "(알 수 없음)",
			character != null ? character.getServerName() : "",
			item.getRaidName(),
			item.getDifficulty(),
			matched != null ? matched.getBoundGold() : 0,
			matched != null ? matched.getTradableGold() : 0,
			isCompletedThisWeek(item.getLastCompletedAt())
		);
	}

	static boolean isCompletedThisWeek(Instant lastCompletedAt) {
		if (lastCompletedAt == null) {
			return false;
		}
		return lastCompletedAt.isAfter(mostRecentResetBoundary());
	}

	static Instant mostRecentResetBoundary() {
		ZonedDateTime now = ZonedDateTime.now(RESET_ZONE);
		ZonedDateTime candidate = now.withHour(RESET_HOUR).withMinute(0).withSecond(0).withNano(0);
		int daysSinceReset = (candidate.getDayOfWeek().getValue() - RESET_DAY.getValue() + 7) % 7;
		candidate = candidate.minusDays(daysSinceReset);
		if (candidate.isAfter(now)) {
			candidate = candidate.minusWeeks(1);
		}
		return candidate.toInstant();
	}

	private DiscordUser findUser(String discordId) {
		return userRepository.findByDiscordId(discordId)
			.orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + discordId));
	}

}
