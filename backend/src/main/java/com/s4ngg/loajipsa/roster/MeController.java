package com.s4ngg.loajipsa.roster;

import com.s4ngg.loajipsa.auth.UserAuthInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/me")
public class MeController {

	private final RosterService rosterService;

	public MeController(RosterService rosterService) {
		this.rosterService = rosterService;
	}

	@GetMapping("/roster")
	public List<RosterCharacter> roster(HttpServletRequest request) {
		return rosterService.list(discordId(request));
	}

	@PostMapping("/roster/register")
	public List<RosterCharacter> register(HttpServletRequest request, @RequestBody Map<String, String> body) {
		return rosterService.register(discordId(request), body.get("representativeCharacterName"));
	}

	@PostMapping("/roster/refresh")
	public List<RosterCharacter> refresh(HttpServletRequest request) {
		return rosterService.refresh(discordId(request));
	}

	private String discordId(HttpServletRequest request) {
		return (String) request.getAttribute(UserAuthInterceptor.DISCORD_ID_ATTRIBUTE);
	}

	@ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
	public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException e) {
		return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
	}

	@ExceptionHandler(NoSuchElementException.class)
	public ResponseEntity<Void> handleNotFound() {
		return ResponseEntity.notFound().build();
	}

}
