package com.s4ngg.loajipsa.notice;

import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Set;

/** 이미 처리한 공지 링크를 기억해서 중복 알림/중복 요약(비용 낭비)을 막는다. */
@Slf4j
@Component
public class NoticeSeenStore {

	private static final Path STORE_FILE = Path.of("data", "notice-seen.json");
	private static final int MAX_ENTRIES = 300;

	private final ObjectMapper objectMapper;
	private final Set<String> seenLinks;

	public NoticeSeenStore(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
		this.seenLinks = load();
	}

	public boolean isEmpty() {
		return seenLinks.isEmpty();
	}

	public boolean isSeen(String link) {
		return seenLinks.contains(link);
	}

	public synchronized void markSeen(String link) {
		seenLinks.add(link);
		Iterator<String> it = seenLinks.iterator();
		while (seenLinks.size() > MAX_ENTRIES && it.hasNext()) {
			it.next();
			it.remove();
		}
		save();
	}

	private Set<String> load() {
		if (!Files.exists(STORE_FILE)) {
			return new LinkedHashSet<>();
		}
		try {
			String[] loaded = objectMapper.readValue(STORE_FILE.toFile(), String[].class);
			return new LinkedHashSet<>(Arrays.asList(loaded));
		}
		catch (Exception e) {
			log.warn("공지 확인 이력 파일을 읽지 못해 빈 상태로 시작합니다: {}", e.getMessage());
			return new LinkedHashSet<>();
		}
	}

	private void save() {
		try {
			Files.createDirectories(STORE_FILE.getParent());
			objectMapper.writeValue(STORE_FILE.toFile(), seenLinks);
		}
		catch (Exception e) {
			log.error("공지 확인 이력 파일 저장 실패", e);
		}
	}

}
