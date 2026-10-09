package com.ngo.impact;

import com.fasterxml.jackson.databind.JsonNode;
import com.ngo.impact.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:importtest;DB_CLOSE_DELAY=-1")
class CatalogueImportIntegrationTest extends ApiTestSupport {

    /** Header spellings modelled on the AYUSH Warli catalogue field list given in the repair brief. */
    private static final String HEADER =
            "Sr. No.,Brand,Manufacturer,Product Title,HSN Code,GST %,Selling Price,Product Description,Size,Material,Colour Option,Image,SKU,Upload Status,Category,Stock,Artisan Village\n";

    private Resp upload(String csv, boolean dryRun, String token) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "catalogue.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
        return call(MockMvcRequestBuilders.multipart("/api/admin/products/import").file(file).param("dryRun", String.valueOf(dryRun)),
                token, null);
    }

    @Test
    void importsCreatesUpdatesWithoutBlankingAndReportsProblems() throws Exception {
        String admin = adminToken();
        String csv = HEADER
                + "1,AYUSH,Test Sangh,\"Warli Painted Coaster, Set of 4\",4420,12%,\"₹ 1,250\",\"Hand-painted, \"\"Warli\"\" motifs\",10x10 cm,Bamboo,Red,https://example.org/a.jpg | https://example.org/b.jpg,IMP-001,Uploaded,Warli Merchandise,7,Dahanu\n"
                + "2,AYUSH,Test Sangh,Bamboo Pen Stand,4602,5,450,,,,,,IMP-002,,Bamboo Handicrafts,,\n"
                + "3,AYUSH,Test Sangh,No Price Item,4602,5,,desc,,,,,IMP-003,,Bamboo Handicrafts,1,\n"
                + "4,AYUSH,Test Sangh,Duplicate,4602,5,10,,,,,,IMP-001,,Bamboo Handicrafts,1,\n"
                + ",,,,,,,,,,,,,,,,\n";

        // Dry run reports but saves nothing
        Resp dry = upload(csv, true, admin);
        assertThat(dry.status()).isEqualTo(200);
        assertThat(dry.data().path("created").asInt()).isEqualTo(2);
        assertThat(get("/api/admin/products?query=IMP-001", admin).data().path("totalElements").asInt()).isZero();

        Resp result = upload(csv, false, admin);
        JsonNode r = result.data();
        assertThat(r.path("totalRows").asInt()).isEqualTo(4);
        assertThat(r.path("created").asInt()).isEqualTo(2);
        assertThat(r.path("failed").asInt()).isEqualTo(2);
        assertThat(r.path("extraColumns").toString()).contains("Artisan Village");
        assertThat(r.path("createdCategories").toString()).contains("Warli Merchandise", "Bamboo Handicrafts");
        assertThat(r.path("errors").toString()).contains("Missing selling price", "Duplicate SKU");
        assertThat(r.path("warnings").toString()).contains("No stock quantity");

        JsonNode coaster = get("/api/admin/products?query=IMP-001", admin).data().path("content").get(0);
        assertThat(coaster.path("name").asText()).isEqualTo("Warli Painted Coaster, Set of 4");
        assertThat(coaster.path("price").decimalValue()).isEqualByComparingTo("1250");
        assertThat(coaster.path("gstRate").decimalValue()).isEqualByComparingTo("12");
        assertThat(coaster.path("hsnCode").asText()).isEqualTo("4420");
        assertThat(coaster.path("sourceSerialNo").asText()).isEqualTo("1");
        assertThat(coaster.path("description").asText()).isEqualTo("Hand-painted, \"Warli\" motifs");
        assertThat(coaster.path("imageUrls").size()).isEqualTo(2);
        assertThat(coaster.path("listingStatus").asText()).isEqualTo("Uploaded");
        assertThat(coaster.path("extraAttributes").path("Artisan Village").asText()).isEqualTo("Dahanu");
        assertThat(coaster.path("status").asText()).isEqualTo("ACTIVE");

        JsonNode penStand = get("/api/admin/products?query=IMP-002", admin).data().path("content").get(0);
        assertThat(penStand.path("stockQuantity").asInt()).isZero();
        assertThat(penStand.path("status").asText()).isEqualTo("OUT_OF_STOCK");

        // Re-import with blanks must not erase stored values; only provided cells change
        String update = HEADER + ",,,,,,999,,,,,,IMP-001,,,,\n";
        Resp second = upload(update, false, admin);
        assertThat(second.data().path("updated").asInt()).isEqualTo(1);
        JsonNode after = get("/api/admin/products?query=IMP-001", admin).data().path("content").get(0);
        assertThat(after.path("price").decimalValue()).isEqualByComparingTo("999");
        assertThat(after.path("name").asText()).isEqualTo("Warli Painted Coaster, Set of 4");
        assertThat(after.path("material").asText()).isEqualTo("Bamboo");
        assertThat(after.path("imageUrls").size()).isEqualTo(2);
        assertThat(after.path("extraAttributes").path("Artisan Village").asText()).isEqualTo("Dahanu");

        // A failing row on an existing product must not partially apply
        String bad = HEADER + ",,,Renamed,,,abc,,,,,,IMP-001,,,,\n";
        assertThat(upload(bad, false, admin).data().path("failed").asInt()).isEqualTo(1);
        assertThat(get("/api/admin/products?query=IMP-001", admin).data().path("content").get(0).path("name").asText())
                .isEqualTo("Warli Painted Coaster, Set of 4");

        // Imported products are visible on the storefront
        assertThat(get("/api/products?query=warli", null).data().path("totalElements").asInt()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void importRequiresSkuColumnCsvAndAdmin() throws Exception {
        String admin = adminToken();
        assertThat(upload("Name,Price\nA,1\n", false, admin).status()).isEqualTo(400);

        MockMultipartFile xlsx = new MockMultipartFile("file", "catalogue.xlsx", "application/octet-stream", new byte[]{1, 2});
        assertThat(call(MockMvcRequestBuilders.multipart("/api/admin/products/import").file(xlsx), admin, null).status())
                .isEqualTo(400);

        assertThat(upload(HEADER, false, newCustomer()).status()).isEqualTo(403);
    }

    @Test
    void exportProducesCsvWithHeader() throws Exception {
        var res = mvc.perform(MockMvcRequestBuilders.get("/api/admin/products/export")
                .header("Authorization", "Bearer " + adminToken())).andReturn().getResponse();
        assertThat(res.getStatus()).isEqualTo(200);
        assertThat(res.getContentAsString(StandardCharsets.UTF_8)).startsWith("Sr No,SKU,Product Title");
    }
}
