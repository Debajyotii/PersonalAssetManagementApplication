package com.deba.assetmanagement.controller;

import com.deba.assetmanagement.dto.MonthlyAssetBalance;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class BankBalanceController {

    private static final Map<String, List<MonthlyAssetBalance>> mockData = new HashMap<>();

    static {
        mockData.put("2022-2023", new ArrayList<>(List.of(
                new MonthlyAssetBalance("Apr", "ABC", 5000),
                new MonthlyAssetBalance("Apr", "MNO", 7000),
                new MonthlyAssetBalance("Apr", "XYZ", 3000),
                new MonthlyAssetBalance("May", "ABC", 5500),
                new MonthlyAssetBalance("May", "MNO", 7300),
                new MonthlyAssetBalance("May", "XYZ", 3200)
        )));
        mockData.put("2023-2024", new ArrayList<>(List.of(
                new MonthlyAssetBalance("Apr", "ABC", 6000),
                new MonthlyAssetBalance("Apr", "MNO", 6800),
                new MonthlyAssetBalance("Apr", "XYZ", 2900),
                new MonthlyAssetBalance("May", "ABC", 6200),
                new MonthlyAssetBalance("May", "MNO", 7100),
                new MonthlyAssetBalance("May", "XYZ", 3100)
        )));
    }

    @GetMapping("/years")
    public Set<String> getYears() {
        return mockData.keySet();
    }

    @GetMapping("/data")
    public List<MonthlyAssetBalance> getData(@RequestParam String year) {
        return mockData.getOrDefault(year, List.of());
    }

    @PostMapping("/save")
    public ResponseEntity<String> saveData(@RequestParam String year,
                                           @RequestBody List<MonthlyAssetBalance> balances) {
        // Replace old entries for same bank+month if exist, else add
        List<MonthlyAssetBalance> yearData = mockData.computeIfAbsent(year, k -> new ArrayList<>());

        for (MonthlyAssetBalance incoming : balances) {
            yearData.removeIf(e ->
                    e.getAsset().equals(incoming.getAsset()) && e.getMonth().equals(incoming.getMonth()));
            yearData.add(incoming);
        }

        return ResponseEntity.ok("Saved");
    }

    @DeleteMapping("/asset")
    public ResponseEntity<String> deleteAsset(@RequestParam String year, @RequestParam String asset) {
        List<MonthlyAssetBalance> list = mockData.getOrDefault(year, List.of());
        List<MonthlyAssetBalance> updated = list.stream()
                .filter(b -> !b.getAsset().equalsIgnoreCase(asset))
                .toList();
        mockData.put(year, updated);
        return ResponseEntity.ok("Deleted");
    }

}
