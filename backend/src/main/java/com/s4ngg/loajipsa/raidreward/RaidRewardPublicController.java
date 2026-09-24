package com.s4ngg.loajipsa.raidreward;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 로그인 없이 누구나 조회 가능한 레이드 보상 정보 탭용 API. */
@RestController
public class RaidRewardPublicController {

	private final RaidRewardService service;

	public RaidRewardPublicController(RaidRewardService service) {
		this.service = service;
	}

	@GetMapping("/api/raid-rewards")
	public List<RaidRewardResponse> list() {
		return service.findAll();
	}

}
