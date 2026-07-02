package com.haowen.loginpractice.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {
    private static final String SECRET = "test-secret-that-is-at-least-32-characters-long";

    @Test
    void generatedTokenCanBeVerifiedAndReturnsItsIdentity() {
        JwtService jwtService = new JwtService(SECRET, 60);

        String token = jwtService.generateToken(42L, "haowen");
        AuthenticatedUser user = jwtService.parseToken(token);

        assertEquals(42L, user.userId());
        assertEquals("haowen", user.username());
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService issuer = new JwtService(SECRET, 60);
        JwtService verifier = new JwtService(
                "different-test-secret-that-is-also-long-enough", 60);

        String token = issuer.generateToken(42L, "haowen");

        assertThrows(JwtException.class, () -> verifier.parseToken(token));
    }
}
