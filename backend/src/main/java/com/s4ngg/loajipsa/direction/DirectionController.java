package com.s4ngg.loajipsa.direction;

import com.s4ngg.loajipsa.auth.UserAuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;

/** 원정대 방향성(강화 vs 주차) AI 추천. 인증은 UserAuthInterceptor가 /api/me/** 경로에 공통으로 건다. */
@RestController
@RequestMapping("/api/me/direction")
public class DirectionController {

	private final DirectionService service;

	public DirectionController(DirectionService service) {
		this.service = service;
	}

	@PostMapping("/recommend")
	public DirectionResponse recommend(HttpServletRequest request, @RequestBody DirectionRequest body) {
		String discordId = (String) request.getAttribute(UserAuthInterceptor.DISCORD_ID_ATTRIBUTE);
		return service.recommend(discordId, body);
	}

	@ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
	public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException e) {
		return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
	}

	@ExceptionHandler(NoSuchElementException.class)
	public ResponseEntity<Void> handleNotFound() {
		return ResponseEntity.notFound().build();
	}

}
