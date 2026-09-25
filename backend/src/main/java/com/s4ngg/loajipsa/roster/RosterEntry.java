package com.s4ngg.loajipsa.roster;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** GET /characters/{name}/siblings 응답 항목. 실제 호출로 확인함 (2026-09-24 기준). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RosterEntry(
	@JsonProperty("ServerName") String serverName,
	@JsonProperty("CharacterName") String characterName,
	@JsonProperty("CharacterClassName") String characterClassName,
	@JsonProperty("ItemAvgLevel") String itemAvgLevel
) {

	/** API가 "1,385.00"처럼 천단위 콤마가 섞인 문자열로 내려줘서 직접 파싱해야 한다. */
	public double parsedItemAvgLevel() {
		try {
			return Double.parseDouble(itemAvgLevel.replace(",", "").trim());
		}
		catch (Exception e) {
			return 0;
		}
	}

}
