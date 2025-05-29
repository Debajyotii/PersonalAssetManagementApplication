package com.deba.assetmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthlyAssetBalance {
    private String month;
    private String asset;
    private double balance;
}
