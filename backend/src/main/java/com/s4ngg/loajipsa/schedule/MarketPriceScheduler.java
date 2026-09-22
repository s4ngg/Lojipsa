package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.lostark.LostArkClient;
import com.s4ngg.loajipsa.lostark.LostArkProperties;
import com.s4ngg.loajipsa.lostark.PriceHistoryStore;
import com.s4ngg.loajipsa.slack.SlackNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class MarketPriceScheduler {

	private final LostArkClient lostArkClient;
	private final SlackNotifier slackNotifier;
	private final LostArkProperties properties;
	private final PriceHistoryStore priceHistoryStore;

	public MarketPriceScheduler(LostArkClient lostArkClient, SlackNotifier slackNotifier,
			LostArkProperties properties, PriceHistoryStore priceHistoryStore) {
		this.lostArkClient = lostArkClient;
		this.slackNotifier = slackNotifier;
		this.properties = properties;
		this.priceHistoryStore = priceHistoryStore;
	}

	@Scheduled(cron = "${schedule.market-check-cron:0 */30 * * * *}")
	public void checkWatchedItems() {
		for (LostArkProperties.WatchItem item : properties.watchItems()) {
			if (item.code() <= 0) {
				log.warn("아이템 코드가 설정되지 않았습니다: {} — application.yml의 lostark.watch-items를 채워주세요.", item.name());
				continue;
			}
			try {
				checkItem(item);
			}
			catch (Exception e) {
				log.error("{} 시세 조회 실패", item.name(), e);
			}
		}
	}

	private void checkItem(LostArkProperties.WatchItem item) {
		var result = lostArkClient.getMarketItemPrice(item.code());
		if (result.isEmpty() || result.get(0).stats().isEmpty()) {
			log.warn("{} 시세 데이터가 비어 있습니다 (itemCode={})", item.name(), item.code());
			return;
		}

		double currentPrice = result.get(0).stats().get(0).avgPrice();
		Optional<Double> lastAlertedPrice = priceHistoryStore.getLastAlertedPrice(item.code());

		if (lastAlertedPrice.isEmpty()) {
			slackNotifier.send("%s 시세 추적을 시작합니다: %.1f골드".formatted(item.name(), currentPrice));
			priceHistoryStore.updateLastAlertedPrice(item.code(), currentPrice);
			return;
		}

		double changePercent = (currentPrice - lastAlertedPrice.get()) / lastAlertedPrice.get() * 100;
		if (Math.abs(changePercent) < properties.priceChangeThresholdPercent()) {
			log.debug("{} 변동폭 {}%로 임계값 미만, 알림 생략", item.name(), changePercent);
			return;
		}

		slackNotifier.send("%s 시세 변동: %.1f골드 (이전 알림 대비 %+.1f%%)".formatted(item.name(), currentPrice, changePercent));
		priceHistoryStore.updateLastAlertedPrice(item.code(), currentPrice);
	}

}
