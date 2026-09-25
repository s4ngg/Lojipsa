package com.s4ngg.loajipsa.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/** discordId를 subject로 담은 JWT를 발급/검증한다. */
@Component
public class JwtService {

	private final JwtProperties properties;
	private final SecretKey key;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
	}

	public String issue(String discordId) {
		Instant now = Instant.now();
		Instant expiry = now.plus(Duration.ofHours(properties.expirationHours()));
		return Jwts.builder()
			.subject(discordId)
			.issuedAt(Date.from(now))
			.expiration(Date.from(expiry))
			.signWith(key)
			.compact();
	}

	public Optional<String> verifyAndGetDiscordId(String token) {
		try {
			Claims claims = Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
			return Optional.of(claims.getSubject());
		}
		catch (JwtException | IllegalArgumentException e) {
			return Optional.empty();
		}
	}

}
