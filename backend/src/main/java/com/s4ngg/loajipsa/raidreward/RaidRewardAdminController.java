package com.s4ngg.loajipsa.raidreward;

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

/** 레이드 보상표 관리자 CRUD. 인증은 AdminAuthInterceptor가 /api/admin/** 경로에 공통으로 건다. */
@RestController
@RequestMapping("/api/admin/raid-rewards")
public class RaidRewardAdminController {

	private final RaidRewardService service;

	public RaidRewardAdminController(RaidRewardService service) {
		this.service = service;
	}

	@GetMapping
	public List<RaidRewardResponse> list() {
		return service.findAll();
	}

	@PostMapping
	public RaidRewardResponse create(@RequestBody RaidRewardRequest request) {
		return service.create(request);
	}

	@PutMapping("/{id}")
	public RaidRewardResponse update(@PathVariable Long id, @RequestBody RaidRewardRequest request) {
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
