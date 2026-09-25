package com.s4ngg.loajipsa.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscordUserRepository extends JpaRepository<DiscordUser, Long> {
	Optional<DiscordUser> findByDiscordId(String discordId);
}
