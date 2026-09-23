package com.s4ngg.loajipsa.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * /api/admin/** 요청을 "Authorization: Bearer {ADMIN_TOKEN}" 헤더로만 걸러낸다.
 * 사용자가 본인 혼자 쓰는 용도라 세션/DB 없이 가장 가벼운 방식으로 구현했다.
 */
@Slf4j
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

	private final AdminProperties properties;

	public AdminAuthInterceptor(AdminProperties properties) {
		this.properties = properties;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		// CORS preflight(OPTIONS)는 인증 헤더 없이 오는 게 정상이라 그냥 통과시킨다.
		// 여기서 막으면 실제 요청이 preflight 단계에서 CORS 에러로 죽어버린다.
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}

		if (properties.token() == null || properties.token().isBlank()) {
			log.warn("ADMIN_TOKEN이 설정되지 않아 관리자 API를 막습니다.");
			response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "admin token not configured");
			return false;
		}

		String header = request.getHeader("Authorization");
		if (header == null || !header.equals("Bearer " + properties.token())) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			return false;
		}

		return true;
	}

}
