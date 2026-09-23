package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.notice.Notice;
import com.s4ngg.loajipsa.notice.NoticeContentFetcher;
import com.s4ngg.loajipsa.notice.NoticeListClient;
import com.s4ngg.loajipsa.notice.NoticeProperties;
import com.s4ngg.loajipsa.notice.NoticeSeenStore;
import com.s4ngg.loajipsa.notice.NoticeSummarizer;
import com.s4ngg.loajipsa.slack.SlackNotifier;
import com.s4ngg.loajipsa.status.ActivityLogStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class NoticeSummaryScheduler {

	private final NoticeListClient listClient;
	private final NoticeContentFetcher contentFetcher;
	private final NoticeSummarizer summarizer;
	private final NoticeSeenStore seenStore;
	private final NoticeProperties properties;
	private final SlackNotifier slackNotifier;
	private final ActivityLogStore activityLogStore;

	public NoticeSummaryScheduler(NoticeListClient listClient, NoticeContentFetcher contentFetcher,
			NoticeSummarizer summarizer, NoticeSeenStore seenStore, NoticeProperties properties,
			SlackNotifier slackNotifier, ActivityLogStore activityLogStore) {
		this.listClient = listClient;
		this.contentFetcher = contentFetcher;
		this.summarizer = summarizer;
		this.seenStore = seenStore;
		this.properties = properties;
		this.slackNotifier = slackNotifier;
		this.activityLogStore = activityLogStore;
	}

	@Scheduled(cron = "${schedule.notice-check-cron:0 */15 * * * *}")
	public void checkNewNotices() {
		Set<String> watchedTypes = Set.copyOf(properties.watchedTypes());

		List<Notice> notices;
		try {
			notices = listClient.getNotices();
		}
		catch (Exception e) {
			log.error("공지 목록 조회 실패", e);
			return;
		}

		boolean firstRun = seenStore.isEmpty();
		for (Notice notice : notices) {
			if (!watchedTypes.contains(notice.type()) || seenStore.isSeen(notice.link())) {
				continue;
			}
			if (firstRun) {
				// 처음 켜졌을 때 쌓여있던 과거 공지를 전부 요약해서 스팸처럼 보내지 않는다.
				seenStore.markSeen(notice.link());
				continue;
			}
			processNotice(notice);
		}
	}

	private void processNotice(Notice notice) {
		String body = contentFetcher.fetchBodyText(notice.link());
		String summary = body.isBlank() ? null : summarizer.summarize(notice.title(), body).orElse(null);

		String message = summary != null
			? "[%s] %s\n%s\n%s".formatted(notice.type(), notice.title(), summary, notice.link())
			: "[%s] %s\n%s".formatted(notice.type(), notice.title(), notice.link());

		slackNotifier.send(message);
		activityLogStore.append("공지 알림 발송: " + notice.title());
		seenStore.markSeen(notice.link());
	}

}
