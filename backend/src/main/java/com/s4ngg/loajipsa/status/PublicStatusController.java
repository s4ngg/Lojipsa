package com.s4ngg.loajipsa.status;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인 없이 누구나 볼 수 있는 최소 정보. 시세/로그 같은 운영 정보는 담지 않는다.
 */
@RestController
public class PublicStatusController {

	@GetMapping("/api/public/status")
	public PublicStatus status() {
		return new PublicStatus("숙제·시세 알림", "online");
	}

	public record PublicStatus(String agent, String status) {
	}

}
