package com.s4ngg.loajipsa.lostark;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "lostark")
public record LostArkProperties(String apiKey, String baseUrl, List<WatchItem> watchItems) {

	public record WatchItem(String name, long code) {
	}

}
