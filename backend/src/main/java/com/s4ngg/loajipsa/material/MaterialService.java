package com.s4ngg.loajipsa.material;

import com.s4ngg.loajipsa.lostark.LostArkClient;
import com.s4ngg.loajipsa.lostark.MarketItemPrice;
import com.s4ngg.loajipsa.lostark.MarketSearchRequest;
import com.s4ngg.loajipsa.lostark.MarketSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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

	private final TrackedMaterialRepository repository;
	private final LostArkClient lostArkClient;

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
		return TrackedMaterialResponse.from(repository.save(entity));
	}

	public TrackedMaterialResponse update(Long id, TrackedMaterialRequest request) {
		TrackedMaterial entity = repository.findById(id)
			.orElseThrow(() -> new NoSuchElementException("TrackedMaterial not found: " + id));
		apply(entity, request);
		return TrackedMaterialResponse.from(repository.save(entity));
	}

	public void delete(Long id) {
		if (!repository.existsById(id)) {
			throw new NoSuchElementException("TrackedMaterial not found: " + id);
		}
		repository.deleteById(id);
	}

	/**
	 * 거래소 API가 아이템당 최근 2주치 일별 시세(Stats)를 한 번에 내려주기 때문에,
	 * 별도로 우리가 매일 시세를 저장해두지 않고도 "오늘 vs 1주일 전"을 그 자리에서 계산할 수 있다.
	 */
	public List<MaterialPriceComparison> getPriceComparisons() {
		Map<Long, String> icons = fetchIcons();
		return repository.findAll().stream()
			.map(material -> compare(material, icons))
			.flatMap(Optional::stream)
			.toList();
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
