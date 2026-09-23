package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.event.CalendarEvent;
import com.s4ngg.loajipsa.event.EventAlertStore;
import com.s4ngg.loajipsa.event.EventCalendarClient;
import com.s4ngg.loajipsa.event.EventProperties;
import com.s4ngg.loajipsa.slack.SlackNotifier;
import com.s4ngg.loajipsa.status.ActivityLogStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class EventReminderScheduler {

	private final EventCalendarClient calendarClient;
	private final EventProperties properties;
	private final EventAlertStore alertStore;
	private final SlackNotifier slackNotifier;
	private final ActivityLogStore activityLogStore;

	public EventReminderScheduler(EventCalendarClient calendarClient, EventProperties properties,
			EventAlertStore alertStore, SlackNotifier slackNotifier, ActivityLogStore activityLogStore) {
		this.calendarClient = calendarClient;
		this.properties = properties;
		this.alertStore = alertStore;
		this.slackNotifier = slackNotifier;
		this.activityLogStore = activityLogStore;
	}

	@Scheduled(cron = "${schedule.event-check-cron:0 * * * * *}")
	public void checkUpcomingEvents() {
		LocalDateTime now = LocalDateTime.now();
		alertStore.forgetPast(now);

		Set<String> watched = Set.copyOf(properties.watchedCategories());
		List<CalendarEvent> events;
		try {
			events = calendarClient.getCalendar();
		}
		catch (Exception e) {
			log.error("일정 조회 실패", e);
			return;
		}

		List<Occurrence> due = new ArrayList<>();
		for (CalendarEvent event : events) {
			if (!watched.contains(event.categoryName())) {
				continue;
			}
			for (String startTimeStr : event.startTimes()) {
				findDueOccurrence(event, startTimeStr, now).ifPresent(due::add);
			}
		}

		if (due.isEmpty()) {
			return;
		}

		// 한 틱에서 여러 일정이 동시에 걸리면 메시지를 하나로 묶어서 보낸다.
		// (개별로 보내면 Slack rate limit에 걸리기 쉽고, 사용자 입장에서도 알림이 연달아 오는 것보다 낫다)
		String message = due.stream()
			.map(o -> "%d분 뒤 [%s] %s (%s)".formatted(o.minutesUntil, o.event.categoryName(), o.event.contentsName(), o.event.location()))
			.collect(Collectors.joining("\n"));
		slackNotifier.send(message);
		activityLogStore.append(due.size() == 1 ? message : "%d건 일정 알림 발송".formatted(due.size()));

		for (Occurrence o : due) {
			alertStore.markAlerted(o.event.contentsName(), o.startTimeStr);
		}
	}

	private Optional<Occurrence> findDueOccurrence(CalendarEvent event, String startTimeStr, LocalDateTime now) {
		LocalDateTime startTime;
		try {
			startTime = LocalDateTime.parse(startTimeStr);
		}
		catch (DateTimeParseException e) {
			return Optional.empty();
		}

		long minutesUntil = Duration.between(now, startTime).toMinutes();
		if (minutesUntil < 0 || minutesUntil > properties.reminderMinutesBefore()) {
			return Optional.empty();
		}
		if (alertStore.alreadyAlerted(event.contentsName(), startTimeStr)) {
			return Optional.empty();
		}

		return Optional.of(new Occurrence(event, startTimeStr, minutesUntil));
	}

	private record Occurrence(CalendarEvent event, String startTimeStr, long minutesUntil) {
	}

}
