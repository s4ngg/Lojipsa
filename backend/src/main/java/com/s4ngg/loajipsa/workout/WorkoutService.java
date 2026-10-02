package com.s4ngg.loajipsa.workout;

import com.s4ngg.loajipsa.anthropic.AnthropicClient;
import com.s4ngg.loajipsa.auth.DiscordUser;
import com.s4ngg.loajipsa.auth.DiscordUserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
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
			.map(e -> "%s요일: %s %d세트 x %d회%s".formatted(
				DAY_LABELS.getOrDefault(e.getDayOfWeek(), e.getDayOfWeek()),
				e.getExerciseName(), e.getSets(), e.getReps(),
				e.getWeightKg() != null ? " (%.1fkg)".formatted(e.getWeightKg()) : ""))
			.collect(Collectors.joining("\n"));

		String prompt = """
			너는 운동 루틴을 피드백해주는 트레이너 어시스턴트다. 아래 루틴을 보고 근육군 분배,
			휴식일 간격, 반복/세트 구성이 적절한지 한국어로 3~5문장 피드백해줘. 잘된 점과
			개선하면 좋을 점을 함께 짚어주고, 의학적 조언이 아니라 일반적인 운동 가이드라인
			기준의 의견임을 전제로 말해줘. 인사말이나 서론 없이 바로 피드백 내용만 말해줘.

			루틴 이름: %s
			주간 스케줄:
			%s
			%s
			""".formatted(
			title, schedule,
			context.isBlank() ? "" : "추가로 참고할 운동 가이드라인:\n" + context
		);

		return anthropicClient.complete(prompt, 400)
			.orElse("AI 피드백을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
	}

	private void saveExercises(Long routineId, List<WorkoutExerciseInput> inputs) {
		if (inputs == null || inputs.isEmpty()) {
			return;
		}
		List<WorkoutExercise> exercises = IntStream.range(0, inputs.size())
			.mapToObj(i -> {
				WorkoutExerciseInput input = inputs.get(i);
				return new WorkoutExercise(routineId, input.dayOfWeek(), input.exerciseName(),
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
