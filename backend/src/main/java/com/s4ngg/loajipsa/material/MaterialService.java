package com.s4ngg.loajipsa.material;

import com.s4ngg.loajipsa.lostark.LostArkClient;
import com.s4ngg.loajipsa.lostark.MarketItemPrice;
import com.s4ngg.loajipsa.lostark.MarketSearchRequest;
import com.s4ngg.loajipsa.lostark.MarketSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MaterialService {

	/** 지금까지 등록된 추적 재료는 전부 이 카테고리(재련 재료) 소속이라 아이콘 조회 범위를 여기로 고정한다. */
	private static final int REFINING_MATERIAL_CATEGORY = 50010;

	/** 시세는 거래소가 내려주는 일별 통계라 몇 분 단위로 캐시해도 화면에 보이는 값이 달라지지 않는다. */
	private static final Duration PRICE_CACHE_TTL = Duration.ofMinutes(5);

	private final TrackedMaterialRepository repository;
	private final LostArkClient lostArkClient;

	private final Object cacheLock = new Object();
	private volatile CachedComparisons cache;

	private record CachedComparisons(List<MaterialPriceComparison> data, Instant fetchedAt) {
	}

	public MaterialService(TrackedMaterialRepository repository, LostArkClient lostArkClient) {
		this.repository = repository;
		this.lostArkClient = lostArkClient;
	}

	public List<TrackedMaterialResponse> findAll() {
		return repository.findAll().stream().map(TrackedMaterialResponse::from).toList();
	}

	public TrackedMaterialResponse create(TrackedMaterialRequest request) {
		TrackedMaterial entity = new TrackedMaterial();
		apply(entity, request);
		TrackedMaterialResponse saved = TrackedMaterialResponse.from(repository.save(entity));
		cache = null;
		return saved;
	}

	public TrackedMaterialResponse update(Long id, TrackedMaterialRequest request) {
		TrackedMaterial entity = repository.findById(id)
			.orElseThrow(() -> new NoSuchElementException("TrackedMaterial not found: " + id));
		apply(entity, request);
		TrackedMaterialResponse saved = TrackedMaterialResponse.from(repository.save(entity));
		cache = null;
		return saved;
	}

	public void delete(Long id) {
		if (!repository.existsById(id)) {
			throw new NoSuchElementException("TrackedMaterial not found: " + id);
		}
		repository.deleteById(id);
		cache = null;
	}

	/**
	 * 거래소 API가 아이템당 최근 2주치 일별 시세(Stats)를 한 번에 내려주기 때문에,
	 * 별도로 우리가 매일 시세를 저장해두지 않고도 "오늘 vs 1주일 전"을 그 자리에서 계산할 수 있다.
	 */
	public List<MaterialPriceComparison> getPriceComparisons() {
		CachedComparisons cached = cache;
		if (isFresh(cached)) {
			return cached.data();
		}

		// 캐시가 만료된 순간 요청이 몰려도 공식 API 호출은 한 번만 나가도록 갱신을 직렬화한다.
		synchronized (cacheLock) {
			cached = cache;
			if (isFresh(cached)) {
				return cached.data();
			}

			List<TrackedMaterial> materials = repository.findAll();
			Map<Long, String> icons = fetchIcons();
			List<MaterialPriceComparison> fresh = materials.stream()
				.map(material -> compare(material, icons))
				.flatMap(Optional::stream)
				.toList();

			// 일부 재료 조회가 실패한 불완전한 결과는 캐시하지 않는다(다음 요청에서 다시 시도).
			if (fresh.size() == materials.size()) {
				cache = new CachedComparisons(fresh, Instant.now());
			}
			return fresh;
		}
	}

	private boolean isFresh(CachedComparisons cached) {
		return cached != null && Instant.now().isBefore(cached.fetchedAt().plus(PRICE_CACHE_TTL));
	}

	/** 아이콘은 부가 정보라 조회에 실패해도 시세 비교 자체는 계속 진행한다(빈 맵으로 대체). */
	private Map<Long, String> fetchIcons() {
		try {
			MarketSearchResponse response = lostArkClient
				.searchMarketItems(MarketSearchRequest.byCategory(REFINING_MATERIAL_CATEGORY));
			List<MarketSearchResponse.MarketSearchItem> items = response.items() == null ? List.of() : response.items();
			return items.stream()
				.filter(item -> item.icon() != null && !item.icon().isBlank())
				.collect(Collectors.toMap(MarketSearchResponse.MarketSearchItem::id,
					MarketSearchResponse.MarketSearchItem::icon, (a, b) -> a));
		}
		catch (Exception e) {
			log.error("재료 아이콘 목록 조회 실패", e);
			return Map.of();
		}
	}

	private Optional<MaterialPriceComparison> compare(TrackedMaterial material, Map<Long, String> icons) {
		try {
			List<MarketItemPrice> result = lostArkClient.getMarketItemPrice(material.getItemCode());
			if (result.isEmpty() || result.get(0).stats().isEmpty()) {
				log.warn("{} 시세 데이터가 비어 있습니다 (itemCode={})", material.getItemName(), material.getItemCode());
				return Optional.empty();
			}

			String iconUrl = icons.get(material.getItemCode());
			List<MarketItemPrice.DailyStat> stats = result.get(0).stats();
			MarketItemPrice.DailyStat current = stats.get(0);
			LocalDate currentDate = LocalDate.parse(current.date());
			LocalDate targetDate = currentDate.minusDays(7);

			MarketItemPrice.DailyStat weekAgo = stats.stream()
				.min(Comparator.comparingLong(s -> Math.abs(ChronoUnit.DAYS.between(LocalDate.parse(s.date()), targetDate))))
				.orElse(null);

			if (weekAgo == null || weekAgo.date().equals(current.date())) {
				return Optional.of(new MaterialPriceComparison(material.getId(), material.getItemName(),
					material.getItemCode(), current.avgPrice(), current.date(), null, null, null, iconUrl));
			}

			double changePercent = (current.avgPrice() - weekAgo.avgPrice()) / weekAgo.avgPrice() * 100;
			return Optional.of(new MaterialPriceComparison(material.getId(), material.getItemName(),
				material.getItemCode(), current.avgPrice(), current.date(), weekAgo.avgPrice(), weekAgo.date(),
				changePercent, iconUrl));
		}
		catch (Exception e) {
			log.error("{} 시세 비교 실패 (itemCode={})", material.getItemName(), material.getItemCode(), e);
			return Optional.empty();
		}
	}

	private void apply(TrackedMaterial entity, TrackedMaterialRequest request) {
		entity.setItemName(request.itemName());
		entity.setItemCode(request.itemCode());
	}

}
