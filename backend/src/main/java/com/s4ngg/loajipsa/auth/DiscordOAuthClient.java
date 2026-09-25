package com.s4ngg.loajipsa.auth;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class DiscordOAuthClient {

	private final DiscordProperties properties;
	private final RestClient restClient = RestClient.create();

	public DiscordOAuthClient(DiscordProperties properties) {
		this.properties = properties;
	}

	public String exchangeCodeForAccessToken(String code) {
		MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
		body.add("grant_type", "authorization_code");
		body.add("code", code);
		body.add("redirect_uri", properties.redirectUri());
		body.add("client_id", properties.clientId());
		body.add("client_secret", properties.clientSecret());

		DiscordTokenResponse response = restClient.post()
			.uri("https://discord.com/api/oauth2/token")
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(body)
			.retrieve()
			.body(DiscordTokenResponse.class);

		if (response == null) {
			throw new IllegalStateException("Discord 토큰 교환 응답이 비어있음");
		}
		return response.accessToken();
	}

	public DiscordUserInfo fetchUserInfo(String accessToken) {
		DiscordUserInfo info = restClient.get()
			.uri("https://discord.com/api/users/@me")
			.header("Authorization", "Bearer " + accessToken)
			.retrieve()
			.body(DiscordUserInfo.class);

		if (info == null) {
			throw new IllegalStateException("Discord 사용자 정보 조회 실패");
		}
		return info;
	}

}
