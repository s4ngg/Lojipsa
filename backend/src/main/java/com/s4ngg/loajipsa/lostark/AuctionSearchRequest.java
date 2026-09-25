package com.s4ngg.loajipsa.lostark;

import com.fasterxml.jackson.annotation.JsonProperty;

/** POST /auctions/items 요청 본문. 필요한 필드만 채우며, 나머지는 API가 기본값으로 처리한다. */
public record AuctionSearchRequest(
	@JsonProperty("CategoryCode") int categoryCode,
	@JsonProperty("ItemName") String itemName,
	@JsonProperty("PageNo") int pageNo,
	@JsonProperty("Sort") String sort,
	@JsonProperty("SortCondition") String sortCondition
) {

	public static AuctionSearchRequest byName(int categoryCode, String itemName) {
		return new AuctionSearchRequest(categoryCode, itemName, 0, "BUY_PRICE", "ASC");
	}

}
