package com.deba.assetmanagement.util;

import com.deba.assetmanagement.dto.MonthlyAssetBalance;

import java.util.List;
import java.util.Map;

public class Util {
    public static String getPreviousFiscalYear(String currentFiscalYear) {
        // Split on "-"
        String[] years = currentFiscalYear.split("-");
        int startYear = Integer.parseInt(years[0]);
        int endYear = Integer.parseInt(years[1]);

        // Previous year decremented by 1
        return (startYear - 1) + "-" + (endYear - 1);
    }

    public static List<MonthlyAssetBalance> previousYearData(Map<String, List<MonthlyAssetBalance>> mockData, String year) {
        return mockData.getOrDefault(getPreviousFiscalYear(year), List.of()).stream().map(monthlyAssetBalance -> new MonthlyAssetBalance("Apr", monthlyAssetBalance.getAsset(), 0)).toList();

    }
}

