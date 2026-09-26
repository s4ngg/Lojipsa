package com.s4ngg.loajipsa.lostark;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * POST /markets/items 응답 스키마. 가격 이력을 내려주는 GET /markets/items/{itemCode}와 달리
 * Icon(공식 CDN 아이콘 URL)을 포함한다. 카테고리 내 아이템 목록 조회용으로만 사용한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MarketSearchResponse(
	@JsonProperty("TotalCount") int totalCount,
	@JsonProperty("Items") List<MarketSearchItem> items
) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record MarketSearchItem(
		@JsonProperty("Id") long id,
		@JsonProperty("Name") String name,
		@JsonProperty("Icon") String icon
	) {
	}

}
