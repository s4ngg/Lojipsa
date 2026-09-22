package com.s4ngg.loajipsa.slack;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "slack")
public record SlackProperties(String botToken, String channel) {
}
