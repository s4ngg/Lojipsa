package com.s4ngg.loajipsa.raidreward;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 레이드/난이도별 주간 골드 보상. 귀속 골드와 거래 가능(일반) 골드를 분리해서 저장한다.
 * 참고: https://loacheck.com/raid-info/ (재료 상세 보상은 이번 범위 밖, 골드만 다룬다)
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class RaidReward {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String raidName;
	private String difficulty;
	private int minItemLevel;
	private int boundGold;
	private int tradableGold;
	private int weeklyLimitCount = 1;

}
