package com.s4ngg.loajipsa.direction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * AI 추천 시 함께 참고할 배경지식(낙원 단계업, 할모시 보석 등 골드 수치 API로는 안 잡히는
 * 게임 시스템 설명). 패치마다 바뀔 수 있어 코드에 박아두지 않고 관리자가 직접 수정한다.
 * 항상 id=1인 단일 행만 쓴다.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class RecommendationContext {

	@Id
	private Long id = 1L;

	@Lob
	@Column(length = 4000)
	private String content = "";

}
