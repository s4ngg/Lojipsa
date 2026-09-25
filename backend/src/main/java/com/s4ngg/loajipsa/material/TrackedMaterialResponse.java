package com.s4ngg.loajipsa.material;

public record TrackedMaterialResponse(
	Long id,
	String itemName,
	long itemCode
) {

	public static TrackedMaterialResponse from(TrackedMaterial entity) {
		return new TrackedMaterialResponse(entity.getId(), entity.getItemName(), entity.getItemCode());
	}

}
