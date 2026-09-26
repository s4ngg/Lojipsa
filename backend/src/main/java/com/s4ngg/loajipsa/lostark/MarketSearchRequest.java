package com.s4ngg.loajipsa.lostark;

import com.fasterxml.jackson.annotation.JsonProperty;

/** POST /markets/items 요청 본문. 카테고리 내 아이템 목록(아이콘 포함)을 조회할 때 쓴다. */
public record MarketSearchRequest(
	@JsonProperty("CategoryCode") int categoryCode,
	@JsonProperty("PageNo") int pageNo,
	@JsonProperty("SortCondition") String sortCondition
) {

	public static MarketSearchRequest byCategory(int categoryCode) {
		return new MarketSearchRequest(categoryCode, 0, "ASC");
	}

}
