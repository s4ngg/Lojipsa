package com.s4ngg.loajipsa.lostark;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * GET /markets/items/{itemCode} 응답 스키마.
 * 실제 응답을 직접 호출해 확인함 (2026-09-22 기준). ToolTip 필드는 사용하지 않아 무시한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MarketItemPrice(
	@JsonProperty("Name") String name,
	@JsonProperty("BundleCount") Integer bundleCount,
	@JsonProperty("Stats") List<DailyStat> stats
) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record DailyStat(
		@JsonProperty("Date") String date,
		@JsonProperty("AvgPrice") double avgPrice,
		@JsonProperty("TradeCount") int tradeCount
	) {
	}

}
