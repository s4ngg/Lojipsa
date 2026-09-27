package com.s4ngg.loajipsa.roster;

import com.s4ngg.loajipsa.auth.DiscordUser;
import com.s4ngg.loajipsa.auth.DiscordUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
public class RosterService {

	private final RosterLookupClient lookupClient;
	private final RosterCharacterRepository rosterRepository;
	private final DiscordUserRepository userRepository;

	public RosterService(RosterLookupClient lookupClient, RosterCharacterRepository rosterRepository,
			DiscordUserRepository userRepository) {
		this.lookupClient = lookupClient;
		this.rosterRepository = rosterRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public List<RosterCharacter> register(String discordId, String representativeCharacterName) {
		DiscordUser user = findUser(discordId);
		user.setRepresentativeCharacterName(representativeCharacterName);
		userRepository.save(user);
		return refresh(discordId);
	}

	@Transactional
	public List<RosterCharacter> refresh(String discordId) {
		DiscordUser user = findUser(discordId);
		if (user.getRepresentativeCharacterName() == null) {
			throw new IllegalStateException("대표 캐릭터가 먼저 등록되어야 합니다");
		}

		List<RosterEntry> entries = lookupClient.getSiblings(user.getRepresentativeCharacterName());
		if (entries.isEmpty()) {
			throw new IllegalArgumentException(
				"로스트아크에서 해당 캐릭터를 찾을 수 없습니다: " + user.getRepresentativeCharacterName());
		}

		rosterRepository.deleteByDiscordUserId(user.getId());
		List<RosterCharacter> characters = entries.stream()
			.map(e -> {
				RosterCharacter character = new RosterCharacter(user.getId(), e.serverName(), e.characterName(),
					e.characterClassName(), e.parsedItemAvgLevel());
				character.setCharacterImageUrl(fetchCharacterImage(e.characterName()));
				return character;
			})
			.toList();
		return rosterRepository.saveAll(characters);
	}

	/** 캐릭터 초상화는 부가 정보라, 개별 캐릭터 조회가 실패해도 로스터 갱신 자체는 계속 진행한다. */
	private String fetchCharacterImage(String characterName) {
		try {
			CharacterProfileResponse profile = lookupClient.getProfile(characterName);
			return profile != null ? profile.characterImage() : null;
		}
		catch (Exception e) {
			log.warn("{} 캐릭터 초상화 조회 실패", characterName, e);
			return null;
		}
	}

	public List<RosterCharacter> list(String discordId) {
		DiscordUser user = findUser(discordId);
		return rosterRepository.findByDiscordUserId(user.getId());
	}

	private DiscordUser findUser(String discordId) {
		return userRepository.findByDiscordId(discordId)
			.orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + discordId));
	}

}
