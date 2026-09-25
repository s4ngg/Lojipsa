package com.s4ngg.loajipsa.notice;

import com.s4ngg.loajipsa.anthropic.AnthropicClient;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class NoticeSummarizer {

	private final AnthropicClient anthropicClient;
	private final NoticeProperties properties;

	public NoticeSummarizer(AnthropicClient anthropicClient, NoticeProperties properties) {
		this.anthropicClient = anthropicClient;
		this.properties = properties;
	}

	/**
	 * 요약 실패 시 예외를 던지지 않고 빈 Optional을 반환한다 — 호출부가 제목/링크만으로
	 * 폴백해서 발송하게 한다 (AI 장애가 있어도 알림 자체는 계속 나가야 함).
	 */
	public Optional<String> summarize(String title, String content) {
		String truncated = content.length() > properties.maxContentChars()
			? content.substring(0, properties.maxContentChars())
			: content;

		String prompt = """
			다음은 로스트아크 공지사항이다. 게임하는 사람이 30초 안에 이해할 수 있게
			핵심만 한국어 2~3문장으로 요약해줘. 인사말이나 서론 없이 바로 요약만 말해줘.

			제목: %s

			본문:
			%s
			""".formatted(title, truncated);

		return anthropicClient.complete(prompt, 300);
	}

}
