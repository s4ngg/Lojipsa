package com.s4ngg.loajipsa.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String secret, int expirationHours) {
}
