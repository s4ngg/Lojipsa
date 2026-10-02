package com.s4ngg.loajipsa.workout;

import com.s4ngg.loajipsa.anthropic.AnthropicClient;
import com.s4ngg.loajipsa.auth.DiscordUser;
import com.s4ngg.loajipsa.auth.DiscordUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class WorkoutService {

	private static final Map<String, String> DAY_LABELS = Map.of(
		"MON", "월", "TUE", "화", "WED", "수", "THU", "목",
		"FRI", "금", "SAT", "토", "SUN", "일"
	);

	private static final Map<String, Integer> DAY_ORDER = Map.of(
		"MON", 1, "TUE", 2, "WED", 3, "THU", 4, "FRI", 5, "SAT", 6, "SUN", 7
	);

	/** LinkedHashMap으로 순서 고정 — 프롬프트에 항상 같은 순서로 보여주기 위함. */
	private static final Map<String, String> MUSCLE_GROUP_LABELS = new LinkedHashMap<>();
	static {
		MUSCLE_GROUP_LABELS.put("CHEST", "가슴");
		MUSCLE_GROUP_LABELS.put("BACK", "등");
		MUSCLE_GROUP_LABELS.put("LEGS", "하체");
		MUSCLE_GROUP_LABELS.put("SHOULDERS", "어깨");
		MUSCLE_GROUP_LABELS.put("ARMS", "팔");
		MUSCLE_GROUP_LABELS.put("CORE", "코어");
	}

	private final WorkoutRoutineRepository routineRepository;
	private final WorkoutExerciseRepository exerciseRepository;
	private final DiscordUserRepository userRepository;
	private final WorkoutKnowledgeRepository knowledgeRepository;
	private final AnthropicClient anthropicClient;

	public WorkoutService(WorkoutRoutineRepository routineRepository, WorkoutExerciseRepository exerciseRepository,
			DiscordUserRepository userRepository, WorkoutKnowledgeRepository knowledgeRepository,
			AnthropicClient anthropicClient) {
		this.routineRepository = routineRepository;
		this.exerciseRepository = exerciseRepository;
		this.userRepository = userRepository;
		this.knowledgeRepository = knowledgeRepository;
		this.anthropicClient = anthropicClient;
	}

	public List<WorkoutRoutineResponse> listRoutines(String discordId) {
		DiscordUser user = findUser(discordId);
		return routineRepository.findByDiscordUserId(user.getId()).stream()
			.map(this::toResponse)
			.toList();
	}

	public WorkoutRoutineResponse createRoutine(String discordId, WorkoutRoutineRequest request) {
		DiscordUser user = findUser(discordId);
		if (request.title() == null || request.title().isBlank()) {
			throw new IllegalArgumentException("루틴 이름을 입력해주세요");
		}

		WorkoutRoutine routine = new WorkoutRoutine(user.getId(), request.title());
		routine = routineRepository.save(routine);
		saveExercises(routine.getId(), request.exercises());

		return toResponse(routine);
	}

	@Transactional
	public WorkoutRoutineResponse updateRoutine(String discordId, Long routineId, WorkoutRoutineRequest request) {
		DiscordUser user = findUser(discordId);
		WorkoutRoutine routine = findOwnedRoutine(user, routineId);

		routine.setTitle(request.title());
		routine.setUpdatedAt(Instant.now());
		routine = routineRepository.save(routine);

		exerciseRepository.deleteByRoutineId(routine.getId());
		saveExercises(routine.getId(), request.exercises());

		return toResponse(routine);
	}

	@Transactional
	public void deleteRoutine(String discordId, Long routineId) {
		DiscordUser user = findUser(discordId);
		WorkoutRoutine routine = findOwnedRoutine(user, routineId);
		exerciseRepository.deleteByRoutineId(routine.getId());
		routineRepository.delete(routine);
	}

	public WorkoutRoutineResponse requestFeedback(String discordId, Long routineId) {
		DiscordUser user = findUser(discordId);
		WorkoutRoutine routine = findOwnedRoutine(user, routineId);
		List<WorkoutExercise> exercises = exerciseRepository.findByRoutineIdOrderByOrderIndexAsc(routine.getId());

		if (exercises.isEmpty()) {
			throw new IllegalStateException("루틴에 등록된 운동이 없어 피드백을 줄 수 없습니다");
		}

		String context = knowledgeRepository.findById(1L).map(WorkoutKnowledge::getContent).orElse("");
		String feedback = buildFeedback(routine.getTitle(), exercises, context);

		routine.setLastFeedback(feedback);
		routine.setLastFeedbackAt(Instant.now());
		routine = routineRepository.save(routine);

		return toResponse(routine, exercises);
	}

	private String buildFeedback(String title, List<WorkoutExercise> exercises, String context) {
		String schedule = exercises.stream()
			.map(e -> "%s요일: [%s] %s %d세트 x %d회%s".formatted(
				DAY_LABELS.getOrDefault(e.getDayOfWeek(), e.getDayOfWeek()),
				MUSCLE_GROUP_LABELS.getOrDefault(e.getMuscleGroup(), "미분류"),
				e.getExerciseName(), e.getSets(), e.getReps(),
				e.getWeightKg() != null ? " (%.1fkg)".formatted(e.getWeightKg()) : ""))
			.collect(Collectors.joining("\n"));

		String muscleGroupFacts = buildMuscleGroupFacts(exercises);

		String prompt = """
			너는 운동 루틴을 피드백해주는 트레이너 어시스턴트다. 아래 루틴을 보고 근육군 분배,
			휴식일 간격, 반복/세트 구성이 적절한지 한국어로 3~5문장 피드백해줘. 잘된 점과
			개선하면 좋을 점을 함께 짚어주고, 의학적 조언이 아니라 일반적인 운동 가이드라인
			기준의 의견임을 전제로 말해줘. 인사말이나 서론 없이 바로 피드백 내용만 말해줘.

			중요: 아래 "근육군별 요약"은 이미 정확히 계산된 값이다. 요일 간 시간 간격이나 근육군별
			세트 합계를 네가 다시 계산하지 말고, 이 요약에 적힌 숫자를 그대로 근거로 사용해라.

			루틴 이름: %s

			주간 스케줄:
			%s

			근육군별 요약(이미 계산됨, 재계산 금지):
			%s
			%s
			""".formatted(
			title, schedule, muscleGroupFacts,
			context.isBlank() ? "" : "추가로 참고할 운동 가이드라인:\n" + context
		);

		return anthropicClient.complete(prompt, 600)
			.orElse("AI 피드백을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
	}

	/**
	 * 근육군별 주간 세트 합계·훈련 요일·최소 휴식 간격을 Java에서 직접 계산한다. 요일 산수와
	 * 근육군 분류를 LLM에게 맡기면 틀릴 수 있어서(실제로 확인된 사례: 월~금을 48시간 미만으로
	 * 착각, 데드리프트를 하체 운동이 아니라고 누락), 여기서 확정값을 만들어 프롬프트에 그대로
	 * 박아넣는다.
	 */
	private String buildMuscleGroupFacts(List<WorkoutExercise> exercises) {
		Map<String, List<WorkoutExercise>> byGroup = exercises.stream()
			.filter(e -> e.getMuscleGroup() != null)
			.collect(Collectors.groupingBy(WorkoutExercise::getMuscleGroup));

		StringBuilder sb = new StringBuilder();
		for (Map.Entry<String, String> group : MUSCLE_GROUP_LABELS.entrySet()) {
			String label = group.getValue();
			List<WorkoutExercise> groupExercises = byGroup.getOrDefault(group.getKey(), List.of());

			if (groupExercises.isEmpty()) {
				sb.append("- %s: 이번 루틴에 없음\n".formatted(label));
				continue;
			}

			int totalSets = groupExercises.stream().mapToInt(WorkoutExercise::getSets).sum();
			List<String> sortedDays = groupExercises.stream()
				.map(WorkoutExercise::getDayOfWeek)
				.distinct()
				.sorted(Comparator.comparingInt(d -> DAY_ORDER.getOrDefault(d, 0)))
				.toList();
			List<String> sortedDayLabels = sortedDays.stream()
				.map(d -> DAY_LABELS.getOrDefault(d, d))
				.toList();

			String gapDescription;
			if (sortedDays.size() <= 1) {
				gapDescription = "주 1회";
			} else {
				List<Integer> indices = sortedDays.stream().map(d -> DAY_ORDER.getOrDefault(d, 0)).toList();
				int minGapDays = Integer.MAX_VALUE;
				for (int i = 0; i < indices.size() - 1; i++) {
					minGapDays = Math.min(minGapDays, indices.get(i + 1) - indices.get(i));
				}
				int wrapGapDays = 7 - indices.get(indices.size() - 1) + indices.get(0);
				minGapDays = Math.min(minGapDays, wrapGapDays);
				gapDescription = "최소 간격 %d시간".formatted(minGapDays * 24);
			}

			sb.append("- %s: 총 %d세트, 요일 [%s], %s\n".formatted(
				label, totalSets, String.join(", ", sortedDayLabels), gapDescription));
		}
		return sb.toString();
	}

	private void saveExercises(Long routineId, List<WorkoutExerciseInput> inputs) {
		if (inputs == null || inputs.isEmpty()) {
			return;
		}
		List<WorkoutExercise> exercises = IntStream.range(0, inputs.size())
			.mapToObj(i -> {
				WorkoutExerciseInput input = inputs.get(i);
				return new WorkoutExercise(routineId, input.dayOfWeek(), input.muscleGroup(), input.exerciseName(),
					input.sets(), input.reps(), input.weightKg(), i);
			})
			.toList();
		exerciseRepository.saveAll(exercises);
	}

	private WorkoutRoutine findOwnedRoutine(DiscordUser user, Long routineId) {
		return routineRepository.findById(routineId)
			.filter(r -> r.getDiscordUserId().equals(user.getId()))
			.orElseThrow(() -> new NoSuchElementException("루틴을 찾을 수 없습니다: " + routineId));
	}

	private WorkoutRoutineResponse toResponse(WorkoutRoutine routine) {
		List<WorkoutExercise> exercises = exerciseRepository.findByRoutineIdOrderByOrderIndexAsc(routine.getId());
		return toResponse(routine, exercises);
	}

	private WorkoutRoutineResponse toResponse(WorkoutRoutine routine, List<WorkoutExercise> exercises) {
		return new WorkoutRoutineResponse(
			routine.getId(),
			routine.getTitle(),
			exercises.stream().map(WorkoutExerciseResponse::from).toList(),
			routine.getLastFeedback(),
			routine.getLastFeedbackAt(),
			routine.getUpdatedAt()
		);
	}

	private DiscordUser findUser(String discordId) {
		return userRepository.findByDiscordId(discordId)
			.orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + discordId));
	}

}
