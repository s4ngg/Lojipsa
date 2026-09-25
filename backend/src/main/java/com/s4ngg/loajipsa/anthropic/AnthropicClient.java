package com.s4ngg.loajipsa.anthropic;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

/** Claude Messages API 호출용 공용 클라이언트. 공지 요약봇, 원정대 방향성 추천 등이 공유해서 쓴다. */
@Slf4j
@Component
public class AnthropicClient {

	private static final String DEFAULT_MODEL = "claude-haiku-4-5-20251001";

	private final RestClient restClient;

	public AnthropicClient(AnthropicProperties properties) {
		this.restClient = RestClient.builder()
			.baseUrl("https://api.anthropic.com")
			.defaultHeader("x-api-key", properties.apiKey())
			.defaultHeader("anthropic-version", "2023-06-01")
			.build();
	}

	public Optional<String> complete(String prompt, int maxTokens) {
		return complete(DEFAULT_MODEL, prompt, maxTokens);
	}

	/**
	 * 실패 시 예외를 던지지 않고 빈 Optional을 반환한다 — 호출부가 폴백 처리를 하도록.
	 */
	public Optional<String> complete(String model, String prompt, int maxTokens) {
		AnthropicRequest request = new AnthropicRequest(
			model,
			maxTokens,
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

			log.info("Claude 호출 완료 ({}ms, input={}tok, output={}tok)",
				elapsedMs, response.usage().inputTokens(), response.usage().outputTokens());

			return Optional.of(response.content().get(0).text().trim());
		}
		catch (Exception e) {
			log.error("Claude 호출 실패", e);
			return Optional.empty();
		}
	}

}
