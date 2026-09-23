package com.s4ngg.loajipsa.status;

import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 에이전트가 실제로 한 일(알림 발송 등)을 최근 N건까지 파일에 남긴다.
 * /api/status에서 "최근 발송 로그"로 그대로 내려준다.
 */
@Slf4j
@Component
public class ActivityLogStore {

	private static final Path STORE_FILE = Path.of("data", "activity-log.json");
	private static final int MAX_ENTRIES = 20;

	private final ObjectMapper objectMapper;
	private final List<ActivityLogEntry> entries;

	public ActivityLogStore(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.entries = load();
	}

	public synchronized void append(String message) {
		entries.add(0, new ActivityLogEntry(Instant.now().toString(), message));
		while (entries.size() > MAX_ENTRIES) {
			entries.remove(entries.size() - 1);
		}
		save();
	}

	public synchronized List<ActivityLogEntry> recent(int limit) {
		return entries.stream().limit(limit).toList();
	}

	private List<ActivityLogEntry> load() {
		if (!Files.exists(STORE_FILE)) {
			return new ArrayList<>();
		}
		try {
			ActivityLogEntry[] loaded = objectMapper.readValue(STORE_FILE.toFile(), ActivityLogEntry[].class);
			List<ActivityLogEntry> list = new ArrayList<>();
			Collections.addAll(list, loaded);
			return list;
		}
		catch (Exception e) {
			log.warn("활동 로그 파일을 읽지 못해 빈 상태로 시작합니다: {}", e.getMessage());
			return new ArrayList<>();
		}
	}

	private void save() {
		try {
			Files.createDirectories(STORE_FILE.getParent());
			objectMapper.writeValue(STORE_FILE.toFile(), entries);
		}
		catch (Exception e) {
			log.error("활동 로그 파일 저장 실패", e);
		}
	}

}
