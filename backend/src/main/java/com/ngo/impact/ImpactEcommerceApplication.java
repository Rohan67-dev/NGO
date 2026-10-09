package com.ngo.impact;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ImpactEcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImpactEcommerceApplication.class, args);
    }
}
