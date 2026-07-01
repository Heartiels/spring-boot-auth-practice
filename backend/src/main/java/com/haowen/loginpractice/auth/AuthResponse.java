package com.haowen.loginpractice.auth;

public record AuthResponse(
        Long userId,
        String username,
        String token
) {
}
