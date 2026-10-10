package com.ngo.impact.config;

import com.ngo.impact.entity.User;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Demo staff logins use well-known passwords, so they follow the same switch as the other demo accounts.
    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    @Override
    public void run(String... args) throws Exception {
        if (!seedDemoData) {
            return;
        }
        if (!userRepository.existsByEmail("inventory@ngo.org")) {
            User inventory = User.builder()
                    .firstName("Inventory")
                    .lastName("Manager")
                    .email("inventory@ngo.org")
                    .passwordHash(passwordEncoder.encode("inventory123"))
                    .phone("+91 98765 22222")
                    .role(User.Role.INVENTORY_MANAGER)
                    .active(true)
                    .build();
            userRepository.save(inventory);
            log.info("Seeded Inventory Manager");
        }

        if (!userRepository.existsByEmail("dispatcher@ngo.org")) {
            User dispatcher = User.builder()
                    .firstName("Dispatch")
                    .lastName("Manager")
                    .email("dispatcher@ngo.org")
                    .passwordHash(passwordEncoder.encode("dispatcher123"))
                    .phone("+91 98765 33333")
                    .role(User.Role.DISPATCHER)
                    .active(true)
                    .build();
            userRepository.save(dispatcher);
            log.info("Seeded Dispatcher");
        }
    }
}
