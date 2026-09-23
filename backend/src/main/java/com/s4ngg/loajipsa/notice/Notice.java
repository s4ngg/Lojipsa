package com.s4ngg.loajipsa.notice;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** GET /news/notices 응답 항목. 실제 호출로 확인함 (2026-09-24 기준). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Notice(
	@JsonProperty("Title") String title,
	@JsonProperty("Date") String date,
	@JsonProperty("Link") String link,
	@JsonProperty("Type") String type
) {
}
