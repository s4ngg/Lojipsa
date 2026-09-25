package com.s4ngg.loajipsa.anthropic;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AnthropicRequest(String model, @JsonProperty("max_tokens") int maxTokens, List<AnthropicMessage> messages) {

	public record AnthropicMessage(String role, String content) {
	}

}
