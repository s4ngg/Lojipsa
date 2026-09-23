package com.s4ngg.loajipsa.event;

import com.s4ngg.loajipsa.status.ActivityLogEntry;

import java.util.List;

public record EventStatusResponse(
	List<String> watchedCategories,
	int reminderMinutesBefore,
	List<ActivityLogEntry> recentActivity
) {
}
