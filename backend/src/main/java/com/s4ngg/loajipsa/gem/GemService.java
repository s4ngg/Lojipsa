package com.s4ngg.loajipsa.gem;

import com.s4ngg.loajipsa.lostark.AuctionSearchRequest;
import com.s4ngg.loajipsa.lostark.AuctionSearchResponse;
import com.s4ngg.loajipsa.lostark.LostArkClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.OptionalDouble;

@Slf4j
@Service
public class GemService {

	private static final int GEM_CATEGORY_CODE = 210000;

	private final TrackedGemRepository repository;
	private final LostArkClient lostArkClient;

	public GemService(TrackedGemRepository repository, LostArkClient lostArkClient) {
		this.repository = repository;
		this.lostArkClient = lostArkClient;
	}

	public List<TrackedGemResponse> findAll() {
		return repository.findAll().stream().map(TrackedGemResponse::from).toList();
	}

	public TrackedGemResponse create(TrackedGemRequest request) {
		TrackedGem entity = new TrackedGem();
		apply(entity, request);
		return TrackedGemResponse.from(repository.save(entity));
	}

	public TrackedGemResponse update(Long id, TrackedGemRequest request) {
		TrackedGem entity = repository.findById(id)
			.orElseThrow(() -> new NoSuchElementException("TrackedGem not found: " + id));
		apply(entity, request);
		return TrackedGemResponse.from(repository.save(entity));
	}

	public void delete(Long id) {
		if (!repository.existsById(id)) {
			throw new NoSuchElementException("TrackedGem not found: " + id);
		}
		repository.deleteById(id);
	}

	public List<GemPriceSnapshot> getPriceSnapshots() {
		return repository.findAll().stream()
			.map(this::lookup)
			.flatMap(Optional::stream)
			.toList();
	}

	private Optional<GemPriceSnapshot> lookup(TrackedGem gem) {
		try {
			AuctionSearchResponse response = lostArkClient
				.searchAuctionItems(AuctionSearchRequest.byName(GEM_CATEGORY_CODE, gem.getItemName()));

			List<AuctionSearchResponse.AuctionItem> items = response.items() == null ? List.of() : response.items();

			OptionalDouble lowestBuyPrice = items.stream()
				.map(AuctionSearchResponse.AuctionItem::auctionInfo)
				.map(AuctionSearchResponse.AuctionInfo::buyPrice)
				.filter(price -> price != null && price > 0)
				.mapToDouble(Double::doubleValue)
				.min();

			Double lowest = lowestBuyPrice.isPresent() ? lowestBuyPrice.getAsDouble() : null;
			String iconUrl = items.stream()
				.map(AuctionSearchResponse.AuctionItem::icon)
				.filter(icon -> icon != null && !icon.isBlank())
				.findFirst()
				.orElse(null);
			return Optional.of(new GemPriceSnapshot(gem.getId(), gem.getItemName(), lowest, response.totalCount(), iconUrl));
		}
		catch (Exception e) {
			log.error("{} 경매장 시세 조회 실패", gem.getItemName(), e);
			return Optional.empty();
		}
	}

	private void apply(TrackedGem entity, TrackedGemRequest request) {
		entity.setItemName(request.itemName());
	}

}
