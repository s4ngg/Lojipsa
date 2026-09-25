package com.s4ngg.loajipsa.material;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 로그인 없이 누구나 조회 가능한 재료 시세(1주일 비교) API. */
@RestController
public class MaterialPublicController {

	private final MaterialService service;

	public MaterialPublicController(MaterialService service) {
		this.service = service;
	}

	@GetMapping("/api/materials")
	public List<MaterialPriceComparison> list() {
		return service.getPriceComparisons();
	}

}
