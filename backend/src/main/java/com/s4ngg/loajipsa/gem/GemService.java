package com.s4ngg.loajipsa.gem;

import com.s4ngg.loajipsa.lostark.AuctionSearchRequest;
import com.s4ngg.loajipsa.lostark.AuctionSearchResponse;
import com.s4ngg.loajipsa.lostark.LostArkClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.OptionalDouble;

@Slf4j
@Service
public class GemService {

	private static final int GEM_CATEGORY_CODE = 210000;

	/**
	 * 경매장 최저 즉시구매가는 일별 통계가 아니라 실시간에 가까운 값이라, 재료 시세(5분)보다 짧은
	 * 1분으로 잡는다. 1분 안에 여러 방문자가 와도 공식 API 호출은 보석 수만큼 한 번만 나간다.
	 */
	private static final Duration PRICE_CACHE_TTL = Duration.ofMinutes(1);

	private final TrackedGemRepository repository;
	private final LostArkClient lostArkClient;

	private final Object cacheLock = new Object();
	private volatile CachedSnapshots cache;

	private record CachedSnapshots(List<GemPriceSnapshot> data, Instant fetchedAt) {
	}

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
		TrackedGemResponse saved = TrackedGemResponse.from(repository.save(entity));
		cache = null;
		return saved;
	}

	public TrackedGemResponse update(Long id, TrackedGemRequest request) {
		TrackedGem entity = repository.findById(id)
			.orElseThrow(() -> new NoSuchElementException("TrackedGem not found: " + id));
		apply(entity, request);
		TrackedGemResponse saved = TrackedGemResponse.from(repository.save(entity));
		cache = null;
		return saved;
	}

	public void delete(Long id) {
		if (!repository.existsById(id)) {
			throw new NoSuchElementException("TrackedGem not found: " + id);
		}
		repository.deleteById(id);
		cache = null;
	}

	public List<GemPriceSnapshot> getPriceSnapshots() {
		CachedSnapshots cached = cache;
		if (isFresh(cached)) {
			return cached.data();
		}

		// 캐시가 만료된 순간 요청이 몰려도 공식 API 호출은 한 번만 나가도록 갱신을 직렬화한다.
		synchronized (cacheLock) {
			cached = cache;
			if (isFresh(cached)) {
				return cached.data();
			}

			List<TrackedGem> gems = repository.findAll();
			List<GemPriceSnapshot> fresh = gems.stream()
				.map(this::lookup)
				.flatMap(Optional::stream)
				.toList();

			// 일부 보석 조회가 실패한 불완전한 결과는 캐시하지 않는다(다음 요청에서 다시 시도).
			if (fresh.size() == gems.size()) {
				cache = new CachedSnapshots(fresh, Instant.now());
			}
			return fresh;
		}
	}

	private boolean isFresh(CachedSnapshots cached) {
		return cached != null && Instant.now().isBefore(cached.fetchedAt().plus(PRICE_CACHE_TTL));
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
			return Optional.of(new GemPriceSnapshot(gem.getId(), gem.getItemName(), lowest, iconUrl));
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
