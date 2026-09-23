package com.s4ngg.loajipsa.status;

import java.util.List;

public record AgentStatusResponse(
	String agent,
	String status,
	String lastCheckedAt,
	long checkIntervalSeconds,
	List<WatchedItemView> watchedItems,
	List<ActivityLogEntry> recentActivity
) {

	public record WatchedItemView(String name, double price, Double changePercent) {
	}

}
