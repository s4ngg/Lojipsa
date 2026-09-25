package com.s4ngg.loajipsa.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/** /api/me/** 요청을 JWT(Authorization: Bearer ...)로 인증한다. */
@Component
public class UserAuthInterceptor implements HandlerInterceptor {

	public static final String DISCORD_ID_ATTRIBUTE = "discordId";

	private final JwtService jwtService;

	public UserAuthInterceptor(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}

		String header = request.getHeader("Authorization");
		if (header == null || !header.startsWith("Bearer ")) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			return false;
		}

		String token = header.substring("Bearer ".length());
		Optional<String> discordId = jwtService.verifyAndGetDiscordId(token);
		if (discordId.isEmpty()) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			return false;
		}

		request.setAttribute(DISCORD_ID_ATTRIBUTE, discordId.get());
		return true;
	}

}
