package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.feedback.FeedbackService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FeedbackScheduler {

	private final FeedbackService feedbackService;

	public FeedbackScheduler(FeedbackService feedbackService) {
		this.feedbackService = feedbackService;
	}

	@Scheduled(cron = "${schedule.feedback-check-cron:0 0 9 * * *}")
	public void runChecks() {
		try {
			feedbackService.runDirectionCheck();
		}
		catch (Exception e) {
			log.error("피드백 점검 스케줄 실행 실패", e);
		}
	}

}
