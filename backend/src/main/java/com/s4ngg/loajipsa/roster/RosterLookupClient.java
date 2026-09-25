package com.s4ngg.loajipsa.roster;

import com.s4ngg.loajipsa.lostark.LostArkProperties;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class RosterLookupClient {

	private final RestClient restClient;

	public RosterLookupClient(LostArkProperties lostArkProperties) {
		this.restClient = RestClient.builder()
			.baseUrl(lostArkProperties.baseUrl())
			.defaultHeader("Authorization", "bearer " + lostArkProperties.apiKey())
			.build();
	}

	public List<RosterEntry> getSiblings(String characterName) {
		return restClient.get()
			.uri("/characters/{name}/siblings", characterName)
			.retrieve()
			.body(new ParameterizedTypeReference<List<RosterEntry>>() {
			});
	}

}
