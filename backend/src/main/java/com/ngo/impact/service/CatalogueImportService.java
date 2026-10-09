package com.ngo.impact.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ngo.impact.dto.CatalogueImportResult;
import com.ngo.impact.dto.CatalogueImportResult.RowMessage;
import com.ngo.impact.entity.Category;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.ProductImage;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.repository.CategoryRepository;
import com.ngo.impact.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.*;

/**
 * Repeatable, non-destructive catalogue import.
 * <ul>
 *   <li>Rows are matched on SKU. Existing products are updated; blank cells never overwrite stored values.</li>
 *   <li>New products need SKU, title, price and category. Missing stock is imported as 0 (not purchasable) and reported.</li>
 *   <li>Columns without a dedicated field are preserved verbatim in {@code extraAttributes}.</li>
 *   <li>Nothing is invented: rows that cannot be mapped confidently are reported as errors and skipped.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogueImportService {

    /** Canonical field -> accepted header spellings (compared after lower-casing and stripping non-alphanumerics). */
    private static final Map<String, List<String>> HEADER_ALIASES = new LinkedHashMap<>();

    static {
        HEADER_ALIASES.put("sku", List.of("sku", "skucode", "skuid", "sellersku"));
        HEADER_ALIASES.put("name", List.of("producttitle", "title", "productname", "name", "itemname"));
        HEADER_ALIASES.put("sourceSerialNo", List.of("srno", "sno", "serialno", "serialnumber", "slno", "sr", "srnumber"));
        HEADER_ALIASES.put("brand", List.of("brand", "brandname"));
        HEADER_ALIASES.put("manufacturer", List.of("manufacturer", "manufacturername", "manufacturedby"));
        HEADER_ALIASES.put("hsnCode", List.of("hsn", "hsncode", "hsnsac"));
        HEADER_ALIASES.put("gstRate", List.of("gst", "gstrate", "gstpercent", "gstpercentage", "taxrate"));
        HEADER_ALIASES.put("price", List.of("sellingprice", "price", "mrp", "sp", "saleprice"));
        HEADER_ALIASES.put("discountPrice", List.of("discountprice", "offerprice", "discountedprice"));
        HEADER_ALIASES.put("description", List.of("description", "productdescription", "details"));
        HEADER_ALIASES.put("shortDescription", List.of("shortdescription", "summary"));
        HEADER_ALIASES.put("dimensions", List.of("size", "dimensions", "dimension", "sizedimensions"));
        HEADER_ALIASES.put("material", List.of("material", "materials"));
        HEADER_ALIASES.put("colour", List.of("colour", "color", "colouroption", "coloroption", "colours", "colors"));
        HEADER_ALIASES.put("images", List.of("image", "images", "imageurl", "imageurls", "imagelink", "imagelinks", "productimage", "photo"));
        HEADER_ALIASES.put("listingStatus", List.of("listingstatus", "uploadstatus", "marketplacestatus", "uploaded", "listed"));
        HEADER_ALIASES.put("category", List.of("category", "categoryname", "producttype"));
        HEADER_ALIASES.put("stockQuantity", List.of("stock", "stockquantity", "quantity", "qty", "inventory", "availablequantity"));
        HEADER_ALIASES.put("impactDescription", List.of("impactdescription", "impact"));
    }

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductService productService;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    @Transactional
    public CatalogueImportResult importCsv(String csv, boolean dryRun) {
        List<List<String>> rows = CsvParser.parse(stripBom(csv));
        if (rows.isEmpty()) {
            throw new BadRequestException("The CSV file has no header row");
        }

        List<String> headers = rows.get(0);
        Map<String, Integer> fieldIndex = new HashMap<>();
        Map<Integer, String> extraIndex = new LinkedHashMap<>();
        CatalogueImportResult result = CatalogueImportResult.builder().dryRun(dryRun).build();

        for (int i = 0; i < headers.size(); i++) {
            String header = headers.get(i).trim();
            if (header.isEmpty()) continue;
            String field = canonicalField(header);
            if (field != null && !fieldIndex.containsKey(field)) {
                fieldIndex.put(field, i);
                result.getMappedColumns().add(header + " -> " + field);
            } else {
                extraIndex.put(i, header);
                result.getExtraColumns().add(header);
            }
        }
        if (!fieldIndex.containsKey("sku")) {
            throw new BadRequestException("The CSV must have a SKU column (accepted headers: SKU, SKU Code, Seller SKU)");
        }

        Set<String> seenSkus = new HashSet<>();
        Map<String, Category> newCategories = new HashMap<>();

        for (int r = 1; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            int rowNumber = r + 1; // 1-based including header, matches spreadsheet row numbers
            if (row.stream().allMatch(c -> c == null || c.isBlank())) continue;
            result.setTotalRows(result.getTotalRows() + 1);

            String sku = cell(row, fieldIndex, "sku");
            try {
                if (sku == null) {
                    throw new RowException("Missing SKU");
                }
                if (!seenSkus.add(sku.toLowerCase(Locale.ROOT))) {
                    throw new RowException("Duplicate SKU in this file (first occurrence was imported)");
                }

                Optional<Product> existingOpt = productRepository.findBySku(sku);
                // Detach so a row that fails validation half-way can never be flushed by dirty checking
                existingOpt.ifPresent(entityManager::detach);
                boolean isNew = existingOpt.isEmpty();
                Product product = existingOpt.orElseGet(() -> Product.builder()
                        .sku(sku)
                        .status(Product.Status.ACTIVE)
                        .featured(false)
                        .images(new ArrayList<>())
                        .build());

                String name = cell(row, fieldIndex, "name");
                BigDecimal price = parseMoney(cell(row, fieldIndex, "price"), "price");
                BigDecimal discountPrice = parseMoney(cell(row, fieldIndex, "discountPrice"), "discount price");
                BigDecimal gst = parsePercent(cell(row, fieldIndex, "gstRate"));
                Integer stock = parseInteger(cell(row, fieldIndex, "stockQuantity"));
                String categoryName = cell(row, fieldIndex, "category");

                if (isNew) {
                    if (name == null) throw new RowException("Missing product title for a new product");
                    if (price == null) throw new RowException("Missing selling price for a new product");
                    if (categoryName == null) throw new RowException("Missing category for a new product");
                }

                if (name != null) product.setName(name);
                if (price != null) product.setPrice(price);
                if (discountPrice != null) product.setDiscountPrice(discountPrice);
                if (product.getDiscountPrice() != null && product.getPrice() != null
                        && product.getDiscountPrice().compareTo(product.getPrice()) > 0) {
                    throw new RowException("Discount price is higher than the selling price");
                }
                if (gst != null) product.setGstRate(gst);
                setIfPresent(row, fieldIndex, "sourceSerialNo", product::setSourceSerialNo);
                setIfPresent(row, fieldIndex, "brand", product::setBrand);
                setIfPresent(row, fieldIndex, "manufacturer", product::setManufacturer);
                setIfPresent(row, fieldIndex, "hsnCode", product::setHsnCode);
                setIfPresent(row, fieldIndex, "description", product::setDescription);
                setIfPresent(row, fieldIndex, "shortDescription", product::setShortDescription);
                setIfPresent(row, fieldIndex, "dimensions", product::setDimensions);
                setIfPresent(row, fieldIndex, "material", product::setMaterial);
                setIfPresent(row, fieldIndex, "colour", product::setColour);
                setIfPresent(row, fieldIndex, "listingStatus", product::setListingStatus);
                setIfPresent(row, fieldIndex, "impactDescription", product::setImpactDescription);

                if (stock != null) {
                    if (stock < 0) throw new RowException("Stock cannot be negative");
                    product.setStockQuantity(stock);
                } else if (isNew) {
                    product.setStockQuantity(0);
                    result.getWarnings().add(new RowMessage(rowNumber, sku,
                            "No stock quantity in the file - imported with stock 0 (shown as out of stock) until inventory is entered"));
                }

                if (categoryName != null) {
                    product.setCategory(resolveCategory(categoryName, dryRun, newCategories, result));
                }

                List<String> imageUrls = splitImages(cell(row, fieldIndex, "images"));
                if (!imageUrls.isEmpty()) {
                    List<String> invalid = imageUrls.stream().filter(u -> !looksLikeImageReference(u)).toList();
                    if (!invalid.isEmpty()) {
                        result.getWarnings().add(new RowMessage(rowNumber, sku,
                                "Image reference(s) are not URLs or /paths and were kept as-is: " + invalid));
                    }
                    product.getImages().clear();
                    int order = 0;
                    for (String url : imageUrls) {
                        product.getImages().add(ProductImage.builder().product(product).imageUrl(url)
                                .altText(product.getName()).sortOrder(order++).build());
                    }
                } else if (isNew) {
                    result.getWarnings().add(new RowMessage(rowNumber, sku, "No product image in the file"));
                }

                if (!extraIndex.isEmpty()) {
                    Map<String, String> extras = readExtras(product.getExtraAttributes());
                    for (Map.Entry<Integer, String> e : extraIndex.entrySet()) {
                        String value = e.getKey() < row.size() ? row.get(e.getKey()).trim() : "";
                        if (!value.isEmpty()) extras.put(e.getValue(), value);
                    }
                    product.setExtraAttributes(extras.isEmpty() ? null : objectMapper.writeValueAsString(extras));
                }

                if (isNew) {
                    product.setSlug(productService.uniqueSlug(product.getName(), null));
                }
                ProductService.syncStockStatus(product);

                if (!dryRun) {
                    productRepository.save(product);
                }
                if (isNew) result.setCreated(result.getCreated() + 1);
                else result.setUpdated(result.getUpdated() + 1);
            } catch (RowException | JsonProcessingException e) {
                result.setFailed(result.getFailed() + 1);
                result.getErrors().add(new RowMessage(rowNumber, sku, e.getMessage()));
            }
        }

        if (dryRun) {
            // Belt and braces: a dry run must never persist anything
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
        log.info("Catalogue import (dryRun={}): {} rows, {} created, {} updated, {} failed",
                dryRun, result.getTotalRows(), result.getCreated(), result.getUpdated(), result.getFailed());
        return result;
    }

    public String exportCsv() {
        List<String> header = List.of("Sr No", "SKU", "Product Title", "Category", "Brand", "Manufacturer", "HSN Code",
                "GST", "Selling Price", "Discount Price", "Stock", "Status", "Description", "Size", "Material",
                "Colour", "Images", "Listing Status", "Impact Description");
        StringBuilder sb = new StringBuilder();
        sb.append(CsvParser.toLine(header));
        for (Product p : productRepository.findAll()) {
            sb.append(CsvParser.toLine(Arrays.asList(
                    p.getSourceSerialNo(), p.getSku(), p.getName(), p.getCategory().getName(), p.getBrand(),
                    p.getManufacturer(), p.getHsnCode(), str(p.getGstRate()), str(p.getPrice()), str(p.getDiscountPrice()),
                    String.valueOf(p.getStockQuantity()), p.getStatus().name(), p.getDescription(), p.getDimensions(),
                    p.getMaterial(), p.getColour(),
                    String.join(" | ", p.getImages().stream().map(ProductImage::getImageUrl).toList()),
                    p.getListingStatus(), p.getImpactDescription())));
        }
        return sb.toString();
    }

    private Category resolveCategory(String name, boolean dryRun, Map<String, Category> newCategories, CatalogueImportResult result) {
        String key = name.trim().toLowerCase(Locale.ROOT);
        if (newCategories.containsKey(key)) return newCategories.get(key);
        Optional<Category> existing = categoryRepository.findByNameIgnoreCase(name.trim());
        if (existing.isPresent()) return existing.get();

        String slug = SlugUtil.slugify(name);
        Category category = categoryRepository.findBySlug(slug).orElse(null);
        if (category == null) {
            category = Category.builder().name(name.trim()).slug(slug).active(true).build();
            if (!dryRun) category = categoryRepository.save(category);
            result.getCreatedCategories().add(name.trim());
        }
        newCategories.put(key, category);
        return category;
    }

    static String canonicalField(String header) {
        String key = header.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        for (Map.Entry<String, List<String>> e : HEADER_ALIASES.entrySet()) {
            if (e.getValue().contains(key)) return e.getKey();
        }
        return null;
    }

    private static String cell(List<String> row, Map<String, Integer> index, String field) {
        Integer i = index.get(field);
        if (i == null || i >= row.size()) return null;
        String v = row.get(i).trim();
        return v.isEmpty() ? null : v;
    }

    private static void setIfPresent(List<String> row, Map<String, Integer> index, String field, java.util.function.Consumer<String> setter) {
        String v = cell(row, index, field);
        if (v != null) setter.accept(v);
    }

    private static BigDecimal parseMoney(String raw, String label) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("(?i)rs\\.?|inr|₹|,|\\s", "");
        try {
            BigDecimal v = new BigDecimal(cleaned);
            if (v.signum() < 0) throw new RowException("Negative " + label + ": " + raw);
            return v;
        } catch (NumberFormatException e) {
            throw new RowException("Could not read " + label + " '" + raw + "' as a number");
        }
    }

    private static BigDecimal parsePercent(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replace("%", "").trim();
        try {
            BigDecimal v = new BigDecimal(cleaned);
            // A value like 0.05 is a fraction; store percentages consistently (5.00)
            if (v.compareTo(BigDecimal.ONE) < 0 && v.signum() > 0) v = v.movePointRight(2);
            if (v.signum() < 0 || v.compareTo(new BigDecimal("100")) > 0) throw new RowException("GST rate out of range: " + raw);
            return v;
        } catch (NumberFormatException e) {
            throw new RowException("Could not read GST rate '" + raw + "'");
        }
    }

    private static Integer parseInteger(String raw) {
        if (raw == null) return null;
        try {
            return new BigDecimal(raw.replace(",", "").trim()).intValueExact();
        } catch (NumberFormatException | ArithmeticException e) {
            throw new RowException("Could not read stock quantity '" + raw + "' as a whole number");
        }
    }

    static List<String> splitImages(String raw) {
        if (raw == null) return List.of();
        List<String> out = new ArrayList<>();
        for (String part : raw.split("[|;\\n]|,(?=\\s*(https?://|/))")) {
            String t = part.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    private static boolean looksLikeImageReference(String s) {
        return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");
    }

    private Map<String, String> readExtras(String json) {
        if (!StringUtils.hasText(json)) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, String>>() {});
        } catch (JsonProcessingException e) {
            return new LinkedHashMap<>();
        }
    }

    private static String stripBom(String s) {
        return s != null && s.startsWith("\uFEFF") ? s.substring(1) : s;
    }

    private static String str(Object o) {
        return o == null ? "" : o.toString();
    }

    private static class RowException extends RuntimeException {
        RowException(String message) {
            super(message);
        }
    }

    /** Minimal RFC 4180 CSV reader/writer (quoted fields, escaped quotes, embedded newlines). */
    static final class CsvParser {
        private CsvParser() {
        }

        static List<List<String>> parse(String text) {
            List<List<String>> rows = new ArrayList<>();
            if (text == null || text.isEmpty()) return rows;
            List<String> row = new ArrayList<>();
            StringBuilder field = new StringBuilder();
            boolean inQuotes = false;
            for (int i = 0; i < text.length(); i++) {
                char c = text.charAt(i);
                if (inQuotes) {
                    if (c == '"') {
                        if (i + 1 < text.length() && text.charAt(i + 1) == '"') {
                            field.append('"');
                            i++;
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        field.append(c);
                    }
                } else if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    row.add(field.toString());
                    field.setLength(0);
                } else if (c == '\n' || c == '\r') {
                    if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
                    row.add(field.toString());
                    field.setLength(0);
                    rows.add(row);
                    row = new ArrayList<>();
                } else {
                    field.append(c);
                }
            }
            if (field.length() > 0 || !row.isEmpty()) {
                row.add(field.toString());
                rows.add(row);
            }
            return rows;
        }

        static String toLine(List<String> values) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < values.size(); i++) {
                if (i > 0) sb.append(',');
                String v = values.get(i) == null ? "" : values.get(i);
                if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
                    sb.append('"').append(v.replace("\"", "\"\"")).append('"');
                } else {
                    sb.append(v);
                }
            }
            return sb.append("\r\n").toString();
        }
    }
}
