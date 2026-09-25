package com.s4ngg.loajipsa.homework;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * 캐릭터별 주간 숙제(레이드) 체크리스트 항목 하나. 완료 여부는 저장된 boolean이 아니라
 * lastCompletedAt과 "이번 주 초기화 시점"을 비교해서 매번 계산한다 (주간 초기화 스케줄러 없이도
 * 자동으로 다음 주에는 미완료로 보이게 하기 위함) — {@link HomeworkService#isCompletedThisWeek}.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class HomeworkItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long discordUserId;
	private Long rosterCharacterId;
	private String raidName;
	private String difficulty;
	private Instant lastCompletedAt;

}
