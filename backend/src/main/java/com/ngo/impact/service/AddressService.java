package com.ngo.impact.service;

import com.ngo.impact.dto.AddressDTO;
import com.ngo.impact.entity.Address;
import com.ngo.impact.entity.User;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.AddressRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/** Customer address book (the Address entity and repository existed but were never exposed). */
@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressDTO> list(Long userId) {
        return addressRepository.findByUserId(userId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public AddressDTO create(Long userId, AddressDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean first = addressRepository.findByUserId(userId).isEmpty();
        Address address = Address.builder().user(user).build();
        apply(address, dto);
        boolean makeDefault = first || Boolean.TRUE.equals(dto.getIsDefault());
        if (makeDefault) clearDefault(userId);
        address.setIsDefault(makeDefault);
        return toDTO(addressRepository.save(address));
    }

    @Transactional
    public AddressDTO update(Long userId, Long addressId, AddressDTO dto) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        apply(address, dto);
        if (Boolean.TRUE.equals(dto.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            clearDefault(userId);
            address.setIsDefault(true);
        }
        return toDTO(addressRepository.save(address));
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        if (wasDefault) {
            addressRepository.findByUserId(userId).stream().findFirst().ifPresent(a -> {
                a.setIsDefault(true);
                addressRepository.save(a);
            });
        }
    }

    /** Used by checkout's "save this address" option; skips exact duplicates. */
    @Transactional
    public void saveIfNew(Long userId, AddressDTO dto) {
        boolean exists = addressRepository.findByUserId(userId).stream().anyMatch(a ->
                eq(a.getFullName(), dto.getFullName()) && eq(a.getAddressLine1(), dto.getAddressLine1())
                        && eq(a.getAddressLine2(), dto.getAddressLine2()) && eq(a.getCity(), dto.getCity())
                        && eq(a.getPostalCode(), dto.getPostalCode()) && eq(a.getPhone(), dto.getPhone()));
        if (!exists) {
            AddressDTO copy = AddressDTO.builder()
                    .fullName(dto.getFullName()).phone(dto.getPhone())
                    .addressLine1(dto.getAddressLine1()).addressLine2(dto.getAddressLine2())
                    .city(dto.getCity()).state(dto.getState()).postalCode(dto.getPostalCode())
                    .country(dto.getCountry()).isDefault(false).build();
            create(userId, copy);
        }
    }

    private void clearDefault(Long userId) {
        addressRepository.findByUserId(userId).forEach(a -> {
            if (Boolean.TRUE.equals(a.getIsDefault())) {
                a.setIsDefault(false);
                addressRepository.save(a);
            }
        });
    }

    private void apply(Address a, AddressDTO d) {
        a.setFullName(d.getFullName().trim());
        a.setPhone(d.getPhone().trim());
        a.setAddressLine1(d.getAddressLine1().trim());
        a.setAddressLine2(d.getAddressLine2() == null || d.getAddressLine2().isBlank() ? null : d.getAddressLine2().trim());
        a.setCity(d.getCity().trim());
        a.setState(d.getState().trim());
        a.setPostalCode(d.getPostalCode().trim());
        a.setCountry(d.getCountry().trim());
    }

    private AddressDTO toDTO(Address a) {
        return AddressDTO.builder()
                .id(a.getId()).fullName(a.getFullName()).phone(a.getPhone())
                .addressLine1(a.getAddressLine1()).addressLine2(a.getAddressLine2())
                .city(a.getCity()).state(a.getState()).postalCode(a.getPostalCode())
                .country(a.getCountry()).isDefault(a.getIsDefault()).build();
    }

    private static boolean eq(String a, String b) {
        return Objects.equals(a == null ? "" : a.trim().toLowerCase(), b == null ? "" : b.trim().toLowerCase());
    }
}
