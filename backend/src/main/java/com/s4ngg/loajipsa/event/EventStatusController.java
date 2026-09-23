package com.s4ngg.loajipsa.event;

import com.s4ngg.loajipsa.status.ActivityLogStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventStatusController {

	private final EventProperties properties;
	private final ActivityLogStore activityLogStore;

	public EventStatusController(EventProperties properties, ActivityLogStore activityLogStore) {
		this.properties = properties;
		this.activityLogStore = activityLogStore;
	}

	@GetMapping("/api/admin/events/status")
	public EventStatusResponse status() {
		return new EventStatusResponse(
			properties.watchedCategories(),
			properties.reminderMinutesBefore(),
			activityLogStore.recent(10)
		);
	}

}
