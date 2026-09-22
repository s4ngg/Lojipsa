package com.s4ngg.loajipsa.lostark;

import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 마지막으로 알림을 보낸 시점의 가격을 아이템별로 파일에 저장한다.
 * DB를 두기엔 이른 단계라 로컬 JSON 파일로 간단히 관리한다.
 */
@Slf4j
@Component
public class PriceHistoryStore {

	private static final Path STORE_FILE = Path.of("data", "price-history.json");

	private final ObjectMapper objectMapper;
	private final Map<Long, Double> lastAlertedPrice;

	public PriceHistoryStore(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.lastAlertedPrice = load();
	}

	public Optional<Double> getLastAlertedPrice(long itemCode) {
		return Optional.ofNullable(lastAlertedPrice.get(itemCode));
	}

	public synchronized void updateLastAlertedPrice(long itemCode, double price) {
		lastAlertedPrice.put(itemCode, price);
		save();
	}

	private Map<Long, Double> load() {
		if (!Files.exists(STORE_FILE)) {
			return new HashMap<>();
		}
		try {
			Map<String, Double> raw = objectMapper.readValue(STORE_FILE.toFile(),
				objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, Double.class));
			Map<Long, Double> result = new HashMap<>();
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
			objectMapper.writeValue(STORE_FILE.toFile(), lastAlertedPrice);
		}
		catch (Exception e) {
			log.error("가격 이력 파일 저장 실패", e);
		}
	}

}
