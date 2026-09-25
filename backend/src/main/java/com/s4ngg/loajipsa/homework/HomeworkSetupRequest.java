package com.s4ngg.loajipsa.homework;

import java.util.List;

public record HomeworkSetupRequest(
	Long characterId,
	HomeworkSetupMode mode,
	List<ManualRaidSelection> manualSelections
) {

	public record ManualRaidSelection(String raidName, String difficulty) {
	}

}
