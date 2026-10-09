package com.ngo.impact.controller.admin;

import com.ngo.impact.dto.ApiResponse;
import com.ngo.impact.dto.CreateProductRequest;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'STAFF')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

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
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}
