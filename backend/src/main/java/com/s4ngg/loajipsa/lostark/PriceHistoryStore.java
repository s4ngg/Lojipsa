package com.s4ngg.loajipsa.lostark;

import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 아이템별 최신 관찰가/마지막 알림가를 파일에 저장한다.
 * DB를 두기엔 이른 단계라 로컬 JSON 파일로 간단히 관리한다.
 */
@Slf4j
@Component
public class PriceHistoryStore {

	private static final Path STORE_FILE = Path.of("data", "price-history.json");

	private final ObjectMapper objectMapper;
	private final Map<Long, ItemPriceState> state;

	public PriceHistoryStore(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.state = load();
	}

	public Optional<ItemPriceState> get(long itemCode) {
		return Optional.ofNullable(state.get(itemCode));
	}

	/** 매 조회마다 관찰가를 갱신한다 (알림 발송 여부와 무관). */
	public synchronized void recordObservation(long itemCode, double price) {
		Double alertedPrice = Optional.ofNullable(state.get(itemCode))
			.map(ItemPriceState::lastAlertedPrice)
			.orElse(null);
		state.put(itemCode, new ItemPriceState(price, Instant.now().toString(), alertedPrice));
		save();
	}

	/** 실제로 Slack 알림을 보낸 시점의 가격을 기준값으로 갱신한다. */
	public synchronized void recordAlert(long itemCode, double price) {
		state.put(itemCode, new ItemPriceState(price, Instant.now().toString(), price));
		save();
	}

	private Map<Long, ItemPriceState> load() {
		if (!Files.exists(STORE_FILE)) {
			return new HashMap<>();
		}
		try {
			Map<String, ItemPriceState> raw = objectMapper.readValue(STORE_FILE.toFile(),
				objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, ItemPriceState.class));
			Map<Long, ItemPriceState> result = new HashMap<>();
			raw.forEach((key, value) -> result.put(Long.parseLong(key), value));
			return result;
		}
		catch (Exception e) {
			log.warn("가격 이력 파일을 읽지 못해 빈 상태로 시작합니다: {}", e.getMessage());
			return new HashMap<>();
		}
	}

	private void save() {
		try {
			Files.createDirectories(STORE_FILE.getParent());
			objectMapper.writeValue(STORE_FILE.toFile(), state);
		}
		catch (Exception e) {
			log.error("가격 이력 파일 저장 실패", e);
		}
	}

}
