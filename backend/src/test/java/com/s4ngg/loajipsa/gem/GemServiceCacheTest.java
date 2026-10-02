package com.s4ngg.loajipsa.gem;

import com.s4ngg.loajipsa.lostark.AuctionSearchRequest;
import com.s4ngg.loajipsa.lostark.AuctionSearchResponse;
import com.s4ngg.loajipsa.lostark.LostArkClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GemServiceCacheTest {

	private TrackedGemRepository repository;
	private LostArkClient client;
	private GemService service;

	@BeforeEach
	void setUp() {
		repository = mock(TrackedGemRepository.class);
		client = mock(LostArkClient.class);
		service = new GemService(repository, client);

		when(repository.findAll()).thenReturn(List.of(gem(1L, "보석A"), gem(2L, "보석B")));
		when(client.searchAuctionItems(any(AuctionSearchRequest.class))).thenReturn(
			new AuctionSearchResponse(1, List.of(new AuctionSearchResponse.AuctionItem(
				"보석", "유물", "icon.png", new AuctionSearchResponse.AuctionInfo(1000.0)))));
	}

	@Test
	void repeatedCallsWithinTtlHitUpstreamOnlyOncePerGem() {
		for (int i = 0; i < 5; i++) {
			assertEquals(2, service.getPriceSnapshots().size());
		}
		// 보석 2개 x 첫 요청 1회 = 2회. 이후 4번은 캐시에서 응답해 공식 API를 부르지 않는다.
		verify(client, times(2)).searchAuctionItems(any(AuctionSearchRequest.class));
	}

	@Test
	void adminChangeInvalidatesCache() {
		service.getPriceSnapshots();
		when(repository.save(any())).thenReturn(gem(3L, "보석C"));
		service.create(new TrackedGemRequest("보석C"));

		service.getPriceSnapshots();
		verify(client, times(4)).searchAuctionItems(any(AuctionSearchRequest.class));
	}

	@Test
	void incompleteResultIsNotCached() {
		when(client.searchAuctionItems(any(AuctionSearchRequest.class)))
			.thenReturn(new AuctionSearchResponse(1, List.of(new AuctionSearchResponse.AuctionItem(
				"보석", "유물", "icon.png", new AuctionSearchResponse.AuctionInfo(1000.0)))))
			.thenThrow(new RuntimeException("upstream down"))
			.thenReturn(new AuctionSearchResponse(1, List.of(new AuctionSearchResponse.AuctionItem(
				"보석", "유물", "icon.png", new AuctionSearchResponse.AuctionInfo(1000.0)))));

		assertEquals(1, service.getPriceSnapshots().size());
		// 한 보석이 실패한 불완전한 결과는 캐시되지 않아 다음 호출에서 다시 조회한다.
		assertEquals(2, service.getPriceSnapshots().size());
		verify(client, times(4)).searchAuctionItems(any(AuctionSearchRequest.class));
	}

	private static TrackedGem gem(Long id, String name) {
		TrackedGem g = new TrackedGem();
		g.setId(id);
		g.setItemName(name);
		return g;
	}

}
