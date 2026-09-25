package com.s4ngg.loajipsa.config;

import com.s4ngg.loajipsa.admin.AdminAuthInterceptor;
import com.s4ngg.loajipsa.auth.UserAuthInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 프론트엔드(다른 origin)에서 /api/** 를 호출할 수 있게 허용하고, /api/admin/**은 관리자 인증,
 * /api/me/**는 디스코드 로그인 JWT 인증을 건다.
 * TODO: 배포 후 실제 프론트 도메인을 allowed-origins에 추가할 것.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.cors.allowed-origins:http://localhost:3000}")
	private String[] allowedOrigins;

	private final AdminAuthInterceptor adminAuthInterceptor;
	private final UserAuthInterceptor userAuthInterceptor;

	public WebConfig(AdminAuthInterceptor adminAuthInterceptor, UserAuthInterceptor userAuthInterceptor) {
		this.adminAuthInterceptor = adminAuthInterceptor;
		this.userAuthInterceptor = userAuthInterceptor;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
			.allowedOrigins(allowedOrigins)
			.allowedMethods("GET", "POST", "PUT", "DELETE")
			.allowedHeaders("Authorization", "Content-Type");
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(adminAuthInterceptor).addPathPatterns("/api/admin/**");
		registry.addInterceptor(userAuthInterceptor).addPathPatterns("/api/me/**");
	}

}
