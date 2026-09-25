package com.s4ngg.loajipsa.direction;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 추천에 함께 참고할 배경지식(낙원 단계업, 할모시 보석 등 패치마다 바뀌는 게임 시스템 설명)을
 * 관리자가 직접 관리한다. 항상 단일 행(id=1)만 다룬다.
 */
@RestController
@RequestMapping("/api/admin/direction-knowledge")
public class RecommendationContextAdminController {

	private final RecommendationContextRepository repository;

	public RecommendationContextAdminController(RecommendationContextRepository repository) {
		this.repository = repository;
	}

	@GetMapping
	public RecommendationContext get() {
		return repository.findById(1L).orElseGet(RecommendationContext::new);
	}

	@PutMapping
	public RecommendationContext update(@RequestBody UpdateRequest request) {
		RecommendationContext context = repository.findById(1L).orElseGet(RecommendationContext::new);
		context.setContent(request.content());
		return repository.save(context);
	}

	public record UpdateRequest(String content) {
	}

}
