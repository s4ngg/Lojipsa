package com.s4ngg.loajipsa.lostark;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class LostArkClient {

	private final RestClient restClient;

	public LostArkClient(LostArkProperties properties) {
		this.restClient = RestClient.builder()
			.baseUrl(properties.baseUrl())
			.defaultHeader("Authorization", "bearer " + properties.apiKey())
			.build();
	}

	public List<MarketItemPrice> getMarketItemPrice(long itemCode) {
		return restClient.get()
			.uri("/markets/items/{itemCode}", itemCode)
			.retrieve()
			.body(new ParameterizedTypeReference<List<MarketItemPrice>>() {
			});
	}

}
