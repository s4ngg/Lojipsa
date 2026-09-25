package com.s4ngg.loajipsa.homework;

import com.s4ngg.loajipsa.auth.UserAuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/** 캐릭터별 주간 숙제(레이드) 체크리스트. 인증은 UserAuthInterceptor가 /api/me/** 경로에 공통으로 건다. */
@RestController
@RequestMapping("/api/me/homework")
public class HomeworkController {

	private final HomeworkService service;

	public HomeworkController(HomeworkService service) {
		this.service = service;
	}

	@GetMapping
	public List<HomeworkItemResponse> list(HttpServletRequest request) {
		return service.list(discordId(request));
	}

	@PostMapping("/setup")
	public List<HomeworkItemResponse> setup(HttpServletRequest request, @RequestBody HomeworkSetupRequest body) {
		return service.setup(discordId(request), body);
	}

	@PostMapping("/{id}/toggle")
	public HomeworkItemResponse toggle(HttpServletRequest request, @PathVariable Long id) {
		return service.toggle(discordId(request), id);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(HttpServletRequest request, @PathVariable Long id) {
		service.delete(discordId(request), id);
		return ResponseEntity.noContent().build();
	}

	private String discordId(HttpServletRequest request) {
		return (String) request.getAttribute(UserAuthInterceptor.DISCORD_ID_ATTRIBUTE);
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
