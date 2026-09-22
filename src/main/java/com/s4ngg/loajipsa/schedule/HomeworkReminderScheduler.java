package com.s4ngg.loajipsa.schedule;

import com.s4ngg.loajipsa.slack.SlackNotifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Component
public class HomeworkReminderScheduler {

	private final SlackNotifier slackNotifier;

	public HomeworkReminderScheduler(SlackNotifier slackNotifier) {
		this.slackNotifier = slackNotifier;
	}

	@Scheduled(cron = "${schedule.homework-reminder-cron:0 0 6 * * *}")
	public void sendDailyChecklist() {
		StringBuilder message = new StringBuilder("오늘의 로아 숙제 체크리스트\n");
		message.append("- 카오스던전\n");
		message.append("- 가디언 토벌\n");
		message.append("- 주간 레이드/어비스 진행 여부 확인\n");

		if (LocalDate.now().getDayOfWeek() == DayOfWeek.WEDNESDAY) {
			message.append("\n오늘은 수요일 — 주간 레이드/카오스던전 주간 리셋일입니다.");
		}

		slackNotifier.send(message.toString());
	}

}
