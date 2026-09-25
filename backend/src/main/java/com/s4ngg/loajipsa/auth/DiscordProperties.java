package com.s4ngg.loajipsa.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "discord")
public record DiscordProperties(String clientId, String clientSecret, String redirectUri, String frontendRedirectUrl) {
}
