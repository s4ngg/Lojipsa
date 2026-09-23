package com.s4ngg.loajipsa.event;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "events")
public record EventProperties(List<String> watchedCategories, int reminderMinutesBefore) {
}
