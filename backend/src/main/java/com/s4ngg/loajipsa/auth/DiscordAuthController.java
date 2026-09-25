package com.s4ngg.loajipsa.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
public class DiscordAuthController {

	private final DiscordProperties properties;
	private final DiscordOAuthClient oauthClient;
	private final DiscordUserRepository userRepository;
	private final JwtService jwtService;

	public DiscordAuthController(DiscordProperties properties, DiscordOAuthClient oauthClient,
			DiscordUserRepository userRepository, JwtService jwtService) {
		this.properties = properties;
		this.oauthClient = oauthClient;
		this.userRepository = userRepository;
		this.jwtService = jwtService;
	}

	@GetMapping("/api/auth/discord/login")
	public ResponseEntity<Void> login() {
		String redirectUri = URLEncoder.encode(properties.redirectUri(), StandardCharsets.UTF_8);
		String authorizeUrl = "https://discord.com/api/oauth2/authorize"
			+ "?client_id=" + properties.clientId()
			+ "&redirect_uri=" + redirectUri
			+ "&response_type=code"
			+ "&scope=identify";
		return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(authorizeUrl)).build();
	}

	@GetMapping("/api/auth/discord/callback")
	public ResponseEntity<Void> callback(@RequestParam String code) {
		try {
			String accessToken = oauthClient.exchangeCodeForAccessToken(code);
			DiscordUserInfo info = oauthClient.fetchUserInfo(accessToken);

			DiscordUser user = userRepository.findByDiscordId(info.id())
				.orElseGet(() -> new DiscordUser(info.id(), info.username()));
			user.setDiscordUsername(info.username());
			userRepository.save(user);

			String jwt = jwtService.issue(info.id());
			String redirectUrl = properties.frontendRedirectUrl() + "?token=" + jwt;

			return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
		}
		catch (Exception e) {
			log.error("디스코드 로그인 콜백 처리 실패", e);
			return ResponseEntity.status(HttpStatus.FOUND)
				.location(URI.create(properties.frontendRedirectUrl() + "?error=login_failed"))
				.build();
		}
	}

}
