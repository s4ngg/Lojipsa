package com.s4ngg.loajipsa.workout;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 운동 루틴 AI 피드백에 함께 참고할 배경지식(운동 과학 가이드라인)을 관리자가 직접 관리한다.
 * 항상 단일 행(id=1)만 다룬다.
 */
@RestController
@RequestMapping("/api/admin/workout-knowledge")
public class WorkoutKnowledgeAdminController {

	private final WorkoutKnowledgeRepository repository;

	public WorkoutKnowledgeAdminController(WorkoutKnowledgeRepository repository) {
		this.repository = repository;
	}

	@GetMapping
	public WorkoutKnowledge get() {
		return repository.findById(1L).orElseGet(WorkoutKnowledge::new);
	}

	@PutMapping
	public WorkoutKnowledge update(@RequestBody UpdateRequest request) {
		WorkoutKnowledge knowledge = repository.findById(1L).orElseGet(WorkoutKnowledge::new);
		knowledge.setContent(request.content());
		return repository.save(knowledge);
	}

	public record UpdateRequest(String content) {
	}

}
