package com.s4ngg.loajipsa.material;

import com.s4ngg.loajipsa.lostark.LostArkClient;
import com.s4ngg.loajipsa.lostark.MarketItemPrice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MaterialServiceCacheTest {

	private TrackedMaterialRepository repository;
	private LostArkClient client;
	private MaterialService service;

	@BeforeEach
	void setUp() {
		repository = mock(TrackedMaterialRepository.class);
		client = mock(LostArkClient.class);
		service = new MaterialService(repository, client);

		TrackedMaterial a = material(1L, "재료A", 100L);
		TrackedMaterial b = material(2L, "재료B", 200L);
		when(repository.findAll()).thenReturn(List.of(a, b));
		when(client.getMarketItemPrice(anyLong())).thenReturn(List.of(new MarketItemPrice("x", 1, List.of(
			new MarketItemPrice.DailyStat("2026-10-02", 10.0, 1),
			new MarketItemPrice.DailyStat("2026-09-25", 8.0, 1)))));
	}

	@Test
	void repeatedCallsWithinTtlHitUpstreamOnlyOnce() {
		for (int i = 0; i < 5; i++) {
			assertEquals(2, service.getPriceComparisons().size());
		}
		// 재료 2개 x 첫 요청 1회 = 2회. 이후 4번은 캐시에서 응답해 공식 API를 부르지 않는다.
		verify(client, times(2)).getMarketItemPrice(anyLong());
	}

	@Test
	void adminChangeInvalidatesCache() {
		service.getPriceComparisons();
		TrackedMaterial saved = material(3L, "재료C", 300L);
		when(repository.save(org.mockito.ArgumentMatchers.any())).thenReturn(saved);
		service.create(new TrackedMaterialRequest("재료C", 300L));

		service.getPriceComparisons();
		verify(client, times(4)).getMarketItemPrice(anyLong());
	}

	@Test
	void incompleteResultIsNotCached() {
		when(client.getMarketItemPrice(200L)).thenReturn(List.of());

		assertEquals(1, service.getPriceComparisons().size());
		assertEquals(1, service.getPriceComparisons().size());
		// 한 재료가 실패했으므로 캐시되지 않아 두 번째 호출도 다시 조회한다(2회 x 2번).
		verify(client, times(4)).getMarketItemPrice(anyLong());
	}

	private static TrackedMaterial material(Long id, String name, long code) {
		TrackedMaterial m = new TrackedMaterial();
		m.setId(id);
		m.setItemName(name);
		m.setItemCode(code);
		return m;
	}

}
