package com.s4ngg.loajipsa.notice;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "notice")
public record NoticeProperties(List<String> watchedTypes, int maxContentChars) {
}
