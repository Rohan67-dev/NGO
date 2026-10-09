package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CatalogueImportResult;
import com.ngo.impact.dto.CreateProductRequest;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.service.CatalogueImportService;
import com.ngo.impact.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final CatalogueImportService catalogueImportService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> listProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.searchProductsAdmin(categoryId, query, status, sortBy, sortDir, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductByIdAdmin(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductDTO product = productService.createProduct(request);
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(@PathVariable Long id, @Valid @RequestBody CreateProductRequest request) {
        ProductDTO product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        boolean archived = productService.deleteProduct(id);
        String message = archived
                ? "Product has order history, so it was archived (hidden from the shop) instead of deleted"
                : "Product deleted successfully";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    /**
     * Imports / updates products from a CSV catalogue (UTF-8, header row required).
     * Rows are matched on SKU; blank cells never overwrite existing values. Use dryRun=true to validate only.
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CatalogueImportResult>> importCatalogue(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean dryRun) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!name.endsWith(".csv")) {
            throw new BadRequestException("Only .csv files are supported. Export the spreadsheet as CSV (UTF-8) first.");
        }
        CatalogueImportResult result = catalogueImportService.importCsv(
                new String(file.getBytes(), StandardCharsets.UTF_8), dryRun);
        return ResponseEntity.ok(ApiResponse.success(dryRun ? "Dry run complete (nothing saved)" : "Import complete", result));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportCatalogue() {
        byte[] csv = catalogueImportService.exportCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"catalogue-export.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }
}
