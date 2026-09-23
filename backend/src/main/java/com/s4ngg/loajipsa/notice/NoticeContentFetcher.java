package com.s4ngg.loajipsa.notice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 공지 상세 본문은 Lost Ark Open API 범위 밖이라, 서버 렌더링된 공지 페이지 HTML을
 * 직접 읽어서 본문 텍스트만 뽑아낸다. 페이지 구조가 바뀌면 깨질 수 있는 스크레이핑이라
 * 실패해도 예외를 던지지 않고 빈 문자열을 반환한다 (호출부가 제목만으로 폴백).
 */
@Slf4j
@Component
public class NoticeContentFetcher {

	private static final Pattern BODY_PATTERN = Pattern.compile("class=\"fr-view\"[^>]*>(.*?)</div>\\s*</div>", Pattern.DOTALL);
	private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]+>");

	private final RestClient restClient = RestClient.create();

	public String fetchBodyText(String link) {
		try {
			String html = restClient.get().uri(link).retrieve().body(String.class);
			if (html == null) {
				return "";
			}
			Matcher matcher = BODY_PATTERN.matcher(html);
			if (!matcher.find()) {
				return "";
			}
			String text = TAG_PATTERN.matcher(matcher.group(1)).replaceAll(" ");
			text = HtmlUtils.htmlUnescape(text);
			return text.replaceAll("\\s+", " ").trim();
		}
		catch (Exception e) {
			log.warn("공지 본문 가져오기 실패 ({}): {}", link, e.getMessage());
			return "";
		}
	}

}
