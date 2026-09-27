package com.s4ngg.loajipsa.roster;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * GET /armories/characters/{name}/profiles 응답 중 필요한 필드만.
 * CharacterImage는 그 캐릭터의 실제 외형을 렌더링한 공식 CDN 이미지 URL이다
 * (직업 공용 아이콘이 아니라 캐릭터 개인 초상화).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CharacterProfileResponse(
	@JsonProperty("CharacterImage") String characterImage
) {
}
