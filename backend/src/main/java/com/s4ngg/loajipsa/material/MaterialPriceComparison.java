package com.s4ngg.loajipsa.material;

/**
 * 재료 아이템의 현재가와 1주일 전 가격을 비교한 결과.
 * weekAgo* 필드는 거래소 API가 해당 날짜의 데이터를 갖고 있지 않으면 null일 수 있다.
 */
public record MaterialPriceComparison(
	Long id,
	String itemName,
	long itemCode,
	double currentPrice,
	String currentDate,
	Double weekAgoPrice,
	String weekAgoDate,
	Double changePercent
) {
}
