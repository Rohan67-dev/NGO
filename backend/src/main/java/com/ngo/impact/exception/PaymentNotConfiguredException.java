package com.ngo.impact.exception;

public class PaymentNotConfiguredException extends RuntimeException {
    public PaymentNotConfiguredException(String message) {
        super(message);
    }
}
