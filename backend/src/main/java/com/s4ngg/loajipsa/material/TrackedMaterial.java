package com.s4ngg.loajipsa.material;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 시세 추적 대상 재료 아이템. 관리자가 직접 등록/삭제한다 (실제 아이템 코드는 admin이 확인해서 입력). */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class TrackedMaterial {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String itemName;
	private long itemCode;

}
