package com.s4ngg.loajipsa.gem;

public record TrackedGemResponse(
	Long id,
	String itemName
) {

	public static TrackedGemResponse from(TrackedGem entity) {
		return new TrackedGemResponse(entity.getId(), entity.getItemName());
	}

}
