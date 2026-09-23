package com.s4ngg.loajipsa.notice;

import com.s4ngg.loajipsa.status.ActivityLogStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NoticeStatusController {

	private final NoticeProperties properties;
	private final ActivityLogStore activityLogStore;

	public NoticeStatusController(NoticeProperties properties, ActivityLogStore activityLogStore) {
		this.properties = properties;
		this.activityLogStore = activityLogStore;
	}

	@GetMapping("/api/admin/notices/status")
	public NoticeStatusResponse status() {
		return new NoticeStatusResponse(properties.watchedTypes(), activityLogStore.recent(10));
	}

}
