package com.ngo.impact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogueImportResult {
    private boolean dryRun;
    private int totalRows;
    private int created;
    private int updated;
    private int failed;
    @Builder.Default
    private List<String> mappedColumns = new ArrayList<>();
    /** Columns without a dedicated product field. Their values are preserved in the product's extra attributes. */
    @Builder.Default
    private List<String> extraColumns = new ArrayList<>();
    @Builder.Default
    private List<String> createdCategories = new ArrayList<>();
    @Builder.Default
    private List<RowMessage> errors = new ArrayList<>();
    @Builder.Default
    private List<RowMessage> warnings = new ArrayList<>();

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RowMessage {
        private int row;
        private String sku;
        private String message;
    }
}
