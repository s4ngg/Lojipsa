package com.s4ngg.loajipsa.lostark;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class LostArkClient {

	private final RestClient restClient;

	public LostArkClient(LostArkProperties properties) {
		this.restClient = RestClient.builder()
			.baseUrl(properties.baseUrl())
			.defaultHeader("Authorization", "bearer " + properties.apiKey())
			.build();
	}

	/**
	 * TODO: 응답 필드는 Swagger(https://developer-lostark.game.onstove.com API DOCUMENTS
	 * > MARKETS)에서 직접 확인 후 전용 DTO로 교체할 것. 지금은 뼈대 단계라 Map으로 느슨하게 받는다.
	 */
	public List<Map<String, Object>> getMarketItemPrice(long itemCode) {
		return restClient.get()
			.uri("/markets/items/{itemCode}", itemCode)
			.retrieve()
			.body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
			});
	}

}
