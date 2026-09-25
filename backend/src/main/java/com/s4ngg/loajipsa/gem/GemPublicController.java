package com.s4ngg.loajipsa.gem;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 로그인 없이 누구나 조회 가능한 보석 시세(경매장 최저 즉시구매가) API. */
@RestController
public class GemPublicController {

	private final GemService service;

	public GemPublicController(GemService service) {
		this.service = service;
	}

	@GetMapping("/api/gems")
	public List<GemPriceSnapshot> list() {
		return service.getPriceSnapshots();
	}

}
