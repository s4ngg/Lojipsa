package com.s4ngg.loajipsa.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 로컬 개발용 .env 로더. 실제 OS 환경변수가 이미 설정돼 있으면 그쪽이 우선이고,
 * .env는 없을 때만 채워주는 폴백으로 addLast에 등록한다.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	private static final String DOTENV_FILE = ".env";

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path path = Path.of(DOTENV_FILE);
		if (!Files.exists(path)) {
			return;
		}

		Map<String, Object> values = new LinkedHashMap<>();
		try {
			for (String line : Files.readAllLines(path)) {
				String trimmed = line.trim();
				if (trimmed.isEmpty() || trimmed.startsWith("#")) {
					continue;
				}
				int idx = trimmed.indexOf('=');
				if (idx <= 0) {
					continue;
				}
				String key = trimmed.substring(0, idx).trim();
				String value = trimmed.substring(idx + 1).trim();
				values.put(key, value);
			}
		}
		catch (IOException e) {
			throw new IllegalStateException("failed to read .env file", e);
		}

		environment.getPropertySources().addLast(new MapPropertySource("dotenv", values));
	}

}
