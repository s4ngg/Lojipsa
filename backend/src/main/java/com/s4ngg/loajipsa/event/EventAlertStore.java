package com.s4ngg.loajipsa.event;

import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 어떤 일정(콘텐츠명+시작시각)에 이미 알림을 보냈는지 기록해서 중복 알림을 막는다.
 * 지난 일정 기록은 주기적으로 정리해서 파일이 무한히 커지지 않게 한다.
 */
@Slf4j
@Component
public class EventAlertStore {

	private static final Path STORE_FILE = Path.of("data", "event-alerts.json");

	private final ObjectMapper objectMapper;
	private final Set<String> alertedKeys;

	public EventAlertStore(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.alertedKeys = load();
	}

	public boolean alreadyAlerted(String contentsName, String startTime) {
		return alertedKeys.contains(key(contentsName, startTime));
	}

	public synchronized void markAlerted(String contentsName, String startTime) {
		alertedKeys.add(key(contentsName, startTime));
		save();
	}

	public synchronized void forgetPast(LocalDateTime now) {
		boolean changed = alertedKeys.removeIf(key -> isPast(key, now));
		if (changed) {
			save();
		}
	}

	private boolean isPast(String key, LocalDateTime now) {
		String[] parts = key.split("@", 2);
		if (parts.length != 2) {
			return true;
		}
		try {
			return LocalDateTime.parse(parts[1]).isBefore(now.minusHours(1));
		}
		catch (Exception e) {
			return true;
		}
	}

	private String key(String contentsName, String startTime) {
		return contentsName + "@" + startTime;
	}

	private Set<String> load() {
		if (!Files.exists(STORE_FILE)) {
			return new HashSet<>();
		}
		try {
			String[] loaded = objectMapper.readValue(STORE_FILE.toFile(), String[].class);
			return new HashSet<>(java.util.Arrays.asList(loaded));
		}
		catch (Exception e) {
			log.warn("일정 알림 이력 파일을 읽지 못해 빈 상태로 시작합니다: {}", e.getMessage());
			return new HashSet<>();
		}
	}

	private void save() {
		try {
			Files.createDirectories(STORE_FILE.getParent());
			objectMapper.writeValue(STORE_FILE.toFile(), alertedKeys);
		}
		catch (Exception e) {
			log.error("일정 알림 이력 파일 저장 실패", e);
		}
	}

}
