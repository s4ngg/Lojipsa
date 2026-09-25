package com.s4ngg.loajipsa.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DiscordUserInfo(String id, String username) {
}
