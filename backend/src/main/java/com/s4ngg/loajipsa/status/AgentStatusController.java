package com.s4ngg.loajipsa.status;

import com.s4ngg.loajipsa.lostark.ItemPriceState;
import com.s4ngg.loajipsa.lostark.LostArkProperties;
import com.s4ngg.loajipsa.lostark.PriceHistoryStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * 프론트엔드 대시보드가 그대로 그릴 수 있는 형태로 로아집사의 현재 상태를 내려준다.
 * Lost Ark API를 매번 호출하지 않고, 스케줄러가 이미 관찰/기록해둔 값만 읽는다.
 */
@RestController
public class AgentStatusController {

	private final LostArkProperties lostArkProperties;
	private final PriceHistoryStore priceHistoryStore;
	private final ActivityLogStore activityLogStore;
	private final long checkIntervalSeconds;

	public AgentStatusController(
			LostArkProperties lostArkProperties,
			PriceHistoryStore priceHistoryStore,
			ActivityLogStore activityLogStore,
			@Value("${schedule.market-check-interval-seconds:1800}") long checkIntervalSeconds) {
		this.lostArkProperties = lostArkProperties;
		this.priceHistoryStore = priceHistoryStore;
		this.activityLogStore = activityLogStore;
		this.checkIntervalSeconds = checkIntervalSeconds;
	}

	@GetMapping("/api/admin/status")
	public AgentStatusResponse status() {
		List<AgentStatusResponse.WatchedItemView> items = lostArkProperties.watchItems().stream()
			.map(this::toView)
			.toList();

		String lastCheckedAt = lostArkProperties.watchItems().stream()
			.map(item -> priceHistoryStore.get(item.code()))
			.filter(Optional::isPresent)
			.map(Optional::get)
			.map(ItemPriceState::observedAt)
			.max(Comparator.naturalOrder())
			.orElse(null);

		return new AgentStatusResponse(
			"로아집사",
			"online",
			lastCheckedAt,
			checkIntervalSeconds,
			items,
			activityLogStore.recent(10)
		);
	}

	private AgentStatusResponse.WatchedItemView toView(LostArkProperties.WatchItem item) {
		return priceHistoryStore.get(item.code())
			.map(state -> new AgentStatusResponse.WatchedItemView(item.name(), state.lastObservedPrice(), changePercent(state)))
			.orElseGet(() -> new AgentStatusResponse.WatchedItemView(item.name(), 0, null));
	}

	private Double changePercent(ItemPriceState state) {
		if (state.lastAlertedPrice() == null || state.lastAlertedPrice() == 0) {
			return null;
		}
		return (state.lastObservedPrice() - state.lastAlertedPrice()) / state.lastAlertedPrice() * 100;
	}

}
