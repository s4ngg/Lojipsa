package com.s4ngg.loajipsa.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 로컬 개발용 .env 로더. main()에서 SpringApplication.run() 이전에 호출해서
 * 값을 시스템 프로퍼티로 심어준다. 이미 실제 OS 환경변수/시스템 프로퍼티로 설정된 키는 건드리지 않는다.
 */
public final class DotenvLoader {

	private static final Path DOTENV_FILE = Path.of(".env");

	private DotenvLoader() {
	}

	public static void load() {
		if (!Files.exists(DOTENV_FILE)) {
			return;
		}

		try {
			for (String line : Files.readAllLines(DOTENV_FILE)) {
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

				if (System.getProperty(key) == null && System.getenv(key) == null) {
					System.setProperty(key, value);
				}
			}
		}
		catch (IOException e) {
			throw new IllegalStateException("failed to read .env file", e);
		}
	}

}
