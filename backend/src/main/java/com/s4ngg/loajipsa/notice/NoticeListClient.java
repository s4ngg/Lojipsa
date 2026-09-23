package com.s4ngg.loajipsa.notice;

import com.s4ngg.loajipsa.lostark.LostArkProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class NoticeListClient {

	private static final int MAX_ATTEMPTS = 3;
	private static final Duration RETRY_DELAY = Duration.ofMillis(500);

	private final RestClient restClient;

	public NoticeListClient(LostArkProperties lostArkProperties) {
		this.restClient = RestClient.builder()
			.baseUrl(lostArkProperties.baseUrl())
			.defaultHeader("Authorization", "bearer " + lostArkProperties.apiKey())
			.build();
	}

	public List<Notice> getNotices() {
		for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				return restClient.get()
					.uri("/news/notices")
					.retrieve()
					.body(new ParameterizedTypeReference<List<Notice>>() {
					});
			}
			catch (HttpClientErrorException e) {
				log.warn("공지 목록 API 클라이언트 오류 (status={})", e.getStatusCode());
				throw e;
			}
			catch (HttpServerErrorException | ResourceAccessException e) {
				if (attempt == MAX_ATTEMPTS) {
					throw e;
				}
				log.warn("공지 목록 API 호출 실패, {}/{}번째 재시도 예정", attempt, MAX_ATTEMPTS);
				sleep(RETRY_DELAY.multipliedBy(attempt));
			}
		}
		throw new IllegalStateException("unreachable");
	}

	private void sleep(Duration duration) {
		try {
			Thread.sleep(duration.toMillis());
		}
		catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("공지 API 재시도 대기 중 인터럽트됨", e);
		}
	}

}
