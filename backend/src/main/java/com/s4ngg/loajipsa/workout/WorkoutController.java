package com.s4ngg.loajipsa.workout;

import com.s4ngg.loajipsa.auth.UserAuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/** 운동 루틴 저장 + AI 피드백. 인증은 UserAuthInterceptor가 /api/me/** 경로에 공통으로 건다. */
@RestController
@RequestMapping("/api/me/workout")
public class WorkoutController {

	private final WorkoutService service;

	public WorkoutController(WorkoutService service) {
		this.service = service;
	}

	@GetMapping("/routines")
	public List<WorkoutRoutineResponse> list(HttpServletRequest request) {
		return service.listRoutines(discordId(request));
	}

	@PostMapping("/routines")
	public WorkoutRoutineResponse create(HttpServletRequest request, @RequestBody WorkoutRoutineRequest body) {
		return service.createRoutine(discordId(request), body);
	}

	@PutMapping("/routines/{id}")
	public WorkoutRoutineResponse update(HttpServletRequest request, @PathVariable Long id,
			@RequestBody WorkoutRoutineRequest body) {
		return service.updateRoutine(discordId(request), id, body);
	}

	@DeleteMapping("/routines/{id}")
	public ResponseEntity<Void> delete(HttpServletRequest request, @PathVariable Long id) {
		service.deleteRoutine(discordId(request), id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/routines/{id}/feedback")
	public WorkoutRoutineResponse feedback(HttpServletRequest request, @PathVariable Long id) {
		return service.requestFeedback(discordId(request), id);
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
