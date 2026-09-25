package com.s4ngg.loajipsa.lostark;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * POST /auctions/items 응답 스키마. 경매장(개별 아이템, 예: 보석/장신구)은 거래소(/markets)와 달리
 * 일별 평균가 이력이 없고, 현재 등록된 매물 목록만 내려준다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AuctionSearchResponse(
	@JsonProperty("TotalCount") int totalCount,
	@JsonProperty("Items") List<AuctionItem> items
) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record AuctionItem(
		@JsonProperty("Name") String name,
		@JsonProperty("Grade") String grade,
		@JsonProperty("AuctionInfo") AuctionInfo auctionInfo
	) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record AuctionInfo(
		@JsonProperty("BuyPrice") Double buyPrice
	) {
	}

}
