package com.s4ngg.loajipsa.slack;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Component
public class SlackNotifier {

	private final RestClient restClient;
	private final SlackProperties properties;

	public SlackNotifier(SlackProperties properties) {
		this.properties = properties;
		this.restClient = RestClient.builder()
			.baseUrl("https://slack.com/api")
			.defaultHeader("Authorization", "Bearer " + properties.botToken())
			.build();
	}

	/**
	 * Slack 채널에 메시지를 보낸다. 실패해도 예외를 던지지 않고 로그만 남긴다 —
	 * 알림 발송 실패가 전체 스케줄러를 죽이면 안 되기 때문.
	 * TODO: 실패 건 재시도/DeadLetter 적재 등 운영 정책은 이후 단계에서 추가.
	 */
	public void send(String text) {
		try {
			Map<?, ?> response = restClient.post()
				.uri("/chat.postMessage")
				.body(Map.of("channel", properties.channel(), "text", text))
				.retrieve()
				.body(Map.class);

			if (response == null || !Boolean.TRUE.equals(response.get("ok"))) {
				log.error("Slack 발송 실패, 응답: {}", response);
			}
		}
		catch (Exception e) {
			log.error("Slack 발송 중 예외 발생", e);
		}
	}

}
