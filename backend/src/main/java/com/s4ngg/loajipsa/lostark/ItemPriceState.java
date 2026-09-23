package com.s4ngg.loajipsa.lostark;

/**
 * 아이템 하나의 최신 관찰가와, 마지막으로 Slack 알림을 보낸 시점의 가격을 함께 보관한다.
 * lastAlertedPrice가 null이면 아직 한 번도 알림을 보낸 적이 없다는 뜻이다.
 */
public record ItemPriceState(double lastObservedPrice, String observedAt, Double lastAlertedPrice) {
}
