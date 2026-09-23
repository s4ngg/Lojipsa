package com.s4ngg.loajipsa.notice;

import com.s4ngg.loajipsa.status.ActivityLogEntry;

import java.util.List;

public record NoticeStatusResponse(List<String> watchedTypes, List<ActivityLogEntry> recentActivity) {
}
