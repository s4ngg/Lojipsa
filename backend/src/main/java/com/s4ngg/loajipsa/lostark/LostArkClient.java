package com.s4ngg.loajipsa.lostark;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;

@Slf4j
@Component
public class LostArkClient {

	private static final int MAX_ATTEMPTS = 3;
	private static final Duration RETRY_DELAY = Duration.ofMillis(500);

	private final RestClient restClient;

	public LostArkClient(LostArkProperties properties) {
		this.restClient = RestClient.builder()
			.baseUrl(properties.baseUrl())
			.defaultHeader("Authorization", "bearer " + properties.apiKey())
			.build();
	}

	/**
	 * 5xx/네트워크 오류처럼 일시적일 가능성이 있는 실패만 재시도한다.
	 * 401/429 같은 클라이언트 오류는 재시도해도 해결되지 않으므로 바로 예외를 던져
	 * 호출부(스케줄러)가 해당 아이템만 건너뛰게 한다.
	 */
	public List<MarketItemPrice> getMarketItemPrice(long itemCode) {
		return executeWithRetry("itemCode=" + itemCode, () -> restClient.get()
			.uri("/markets/items/{itemCode}", itemCode)
			.retrieve()
			.body(new ParameterizedTypeReference<List<MarketItemPrice>>() {
			}));
	}

	/**
	 * 거래소 카테고리 내 아이템 목록 조회. GET /markets/items/{itemCode}(가격 이력)와 달리
	 * Icon(공식 CDN 아이콘 URL)을 내려주므로, 아이콘이 필요할 때만 보조로 호출한다.
	 */
	public MarketSearchResponse searchMarketItems(MarketSearchRequest request) {
		return executeWithRetry("market category=" + request.categoryCode(), () -> restClient.post()
			.uri("/markets/items")
			.body(request)
			.retrieve()
			.body(MarketSearchResponse.class));
	}

	/**
	 * 경매장(보석/장신구 등 개별 아이템) 검색. 거래소(/markets)와 달리 일별 평균가 이력이 없고,
	 * 검색 시점의 매물 목록만 내려온다.
	 */
	public AuctionSearchResponse searchAuctionItems(AuctionSearchRequest request) {
		return executeWithRetry("auction search: " + request.itemName(), () -> restClient.post()
			.uri("/auctions/items")
			.body(request)
			.retrieve()
			.body(AuctionSearchResponse.class));
	}

	private <T> T executeWithRetry(String label, Supplier<T> call) {
		for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				return call.get();
			}
			catch (HttpClientErrorException.TooManyRequests e) {
				log.warn("Lost Ark API 호출 한도 초과 ({}), 이번 조회는 건너뜁니다", label);
				throw e;
			}
			catch (HttpClientErrorException e) {
				log.warn("Lost Ark API 클라이언트 오류 ({}, status={})", label, e.getStatusCode());
				throw e;
			}
			catch (HttpServerErrorException | ResourceAccessException e) {
				if (attempt == MAX_ATTEMPTS) {
					throw e;
				}
				log.warn("Lost Ark API 호출 실패, {}/{}번째 재시도 예정 ({}, cause={})",
					attempt, MAX_ATTEMPTS, label, e.getMessage());
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
			throw new IllegalStateException("Lost Ark API 재시도 대기 중 인터럽트됨", e);
		}
	}

}
