package com.s4ngg.loajipsa.workout;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 운동 루틴 AI 피드백 시 함께 참고할 배경지식(점진적 과부하, 근육군 분배, 휴식일 등 운동 과학
 * 가이드라인). 모델이 알아서 아는 척하지 않도록 관리자가 직접 검토·수정한 내용만 프롬프트에 넣는다.
 * 항상 id=1인 단일 행만 쓴다.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class WorkoutKnowledge {

	@Id
	private Long id = 1L;

	@Lob
	@Column(length = 4000)
	private String content = "";

}
