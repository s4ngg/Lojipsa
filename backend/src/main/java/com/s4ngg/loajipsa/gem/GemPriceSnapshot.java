package com.s4ngg.loajipsa.gem;

/**
 * 보석의 현재 경매장 최저 즉시구매가. 경매장 API는 거래소와 달리 일별 시세 이력을 제공하지
 * 않아서, 거래소 기반 재료 시세처럼 1주일 전 대비 비교는 제공하지 않는다 (검색 시점 스냅샷만).
 */
public record GemPriceSnapshot(
	Long id,
	String itemName,
	Double lowestBuyPrice,
	int listingCount,
	String iconUrl
) {
}
