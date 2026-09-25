package com.s4ngg.loajipsa.gem;

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
import java.util.NoSuchElementException;

/** 보석 시세 조회 목록 관리자 CRUD. 인증은 AdminAuthInterceptor가 /api/admin/** 경로에 공통으로 건다. */
@RestController
@RequestMapping("/api/admin/gems")
public class GemAdminController {

	private final GemService service;

	public GemAdminController(GemService service) {
		this.service = service;
	}

	@GetMapping
	public List<TrackedGemResponse> list() {
		return service.findAll();
	}

	@PostMapping
	public TrackedGemResponse create(@RequestBody TrackedGemRequest request) {
		return service.create(request);
	}

	@PutMapping("/{id}")
	public TrackedGemResponse update(@PathVariable Long id, @RequestBody TrackedGemRequest request) {
		return service.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		service.delete(id);
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(NoSuchElementException.class)
	public ResponseEntity<Void> handleNotFound() {
		return ResponseEntity.notFound().build();
	}

}
