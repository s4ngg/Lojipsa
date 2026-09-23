package com.s4ngg.loajipsa.notice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class NoticeSummarizer {

	private static final String MODEL = "claude-haiku-4-5-20251001";

	private final RestClient restClient;
	private final NoticeProperties properties;

	public NoticeSummarizer(NoticeProperties properties) {
		this.properties = properties;
		this.restClient = RestClient.builder()
			.baseUrl("https://api.anthropic.com")
			.defaultHeader("x-api-key", properties.anthropicApiKey())
			.defaultHeader("anthropic-version", "2023-06-01")
			.build();
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

		AnthropicRequest request = new AnthropicRequest(
			MODEL,
			300,
			List.of(new AnthropicRequest.AnthropicMessage("user", prompt))
		);

		try {
			long start = System.currentTimeMillis();
			AnthropicResponse response = restClient.post()
				.uri("/v1/messages")
				.body(request)
				.retrieve()
				.body(AnthropicResponse.class);
			long elapsedMs = System.currentTimeMillis() - start;

			if (response == null || response.content().isEmpty()) {
				return Optional.empty();
			}

			log.info("공지 요약 완료 ({}ms, input={}tok, output={}tok)",
				elapsedMs, response.usage().inputTokens(), response.usage().outputTokens());

			return Optional.of(response.content().get(0).text().trim());
		}
		catch (Exception e) {
			log.error("공지 요약 실패, 원문 제목만 사용", e);
			return Optional.empty();
		}
	}

}
