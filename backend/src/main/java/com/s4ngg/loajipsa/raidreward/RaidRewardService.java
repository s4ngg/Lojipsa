package com.s4ngg.loajipsa.raidreward;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RaidRewardService {

	private final RaidRewardRepository repository;

	public RaidRewardService(RaidRewardRepository repository) {
		this.repository = repository;
	}

	public List<RaidRewardResponse> findAll() {
		return repository.findAll().stream().map(RaidRewardResponse::from).toList();
	}

	public RaidRewardResponse create(RaidRewardRequest request) {
		RaidReward entity = new RaidReward();
		apply(entity, request);
		return RaidRewardResponse.from(repository.save(entity));
	}

	public RaidRewardResponse update(Long id, RaidRewardRequest request) {
		RaidReward entity = repository.findById(id)
			.orElseThrow(() -> new NoSuchElementException("RaidReward not found: " + id));
		apply(entity, request);
		return RaidRewardResponse.from(repository.save(entity));
	}

	public void delete(Long id) {
		// deleteById는 존재하지 않는 id에도 예외 없이 조용히 넘어가서, 404를 위해 직접 확인한다.
		if (!repository.existsById(id)) {
			throw new NoSuchElementException("RaidReward not found: " + id);
		}
		repository.deleteById(id);
	}

	private void apply(RaidReward entity, RaidRewardRequest request) {
		entity.setRaidName(request.raidName());
		entity.setDifficulty(request.difficulty());
		entity.setMinItemLevel(request.minItemLevel());
		entity.setBoundGold(request.boundGold());
		entity.setTradableGold(request.tradableGold());
		entity.setWeeklyLimitCount(request.weeklyLimitCount());
	}

}
