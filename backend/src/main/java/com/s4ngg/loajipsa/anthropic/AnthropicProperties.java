package com.s4ngg.loajipsa.anthropic;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "anthropic")
public record AnthropicProperties(String apiKey) {
}
