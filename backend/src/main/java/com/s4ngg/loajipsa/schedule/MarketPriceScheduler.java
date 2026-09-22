package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.lostark.LostArkClient;
import com.s4ngg.loajipsa.lostark.LostArkProperties;
import com.s4ngg.loajipsa.slack.SlackNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MarketPriceScheduler {

	private final LostArkClient lostArkClient;
	private final SlackNotifier slackNotifier;
	private final LostArkProperties properties;

	public MarketPriceScheduler(LostArkClient lostArkClient, SlackNotifier slackNotifier, LostArkProperties properties) {
		this.lostArkClient = lostArkClient;
		this.slackNotifier = slackNotifier;
		this.properties = properties;
	}

	@Scheduled(cron = "${schedule.market-check-cron:0 */30 * * * *}")
	public void checkWatchedItems() {
		for (LostArkProperties.WatchItem item : properties.watchItems()) {
			if (item.code() <= 0) {
				log.warn("아이템 코드가 설정되지 않았습니다: {} — application.yml의 lostark.watch-items를 채워주세요.", item.name());
				continue;
			}
			try {
				var result = lostArkClient.getMarketItemPrice(item.code());
				if (result.isEmpty() || result.get(0).stats().isEmpty()) {
					log.warn("{} 시세 데이터가 비어 있습니다 (itemCode={})", item.name(), item.code());
					continue;
				}

				var stats = result.get(0).stats();
				var latest = stats.get(0);
				String message = stats.size() > 1
					? "%s: %.1f골드 (%s 기준, 전일 %.1f골드)".formatted(item.name(), latest.avgPrice(), latest.date(), stats.get(1).avgPrice())
					: "%s: %.1f골드 (%s 기준)".formatted(item.name(), latest.avgPrice(), latest.date());
				slackNotifier.send(message);
				// TODO: 변동폭이 일정 % 이상일 때만 알림 보내도록 개선 (현재는 매번 발송)
			}
			catch (Exception e) {
				log.error("{} 시세 조회 실패", item.name(), e);
			}
		}
	}

}
