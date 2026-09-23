package com.s4ngg.loajipsa.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * GET /gamecontents/calendar 응답 스키마. 실제 호출로 확인함 (2026-09-24 기준).
 * RewardItems 등 알림에 안 쓰는 필드는 무시한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CalendarEvent(
	@JsonProperty("CategoryName") String categoryName,
	@JsonProperty("ContentsName") String contentsName,
	@JsonProperty("Location") String location,
	@JsonProperty("StartTimes") List<String> startTimes
) {
}
