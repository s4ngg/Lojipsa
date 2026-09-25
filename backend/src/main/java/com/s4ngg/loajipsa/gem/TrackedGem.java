package com.s4ngg.loajipsa.gem;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 시세 조회 대상 보석. 경매장 아이템은 거래소 아이템과 달리 고유 itemCode가 없어서,
 * 등록된 이름으로 매번 경매장을 검색해 최저 즉시구매가를 조회한다.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class TrackedGem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** 경매장 검색에 쓰이는 정확한 아이템명 (예: "10레벨 겁화의 보석"). */
	private String itemName;

}
