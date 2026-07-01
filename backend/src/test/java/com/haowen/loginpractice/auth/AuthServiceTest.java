package com.haowen.loginpractice.auth;

import com.haowen.loginpractice.security.JwtService;
import com.haowen.loginpractice.user.AppUser;
import com.haowen.loginpractice.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {
    private AppUserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(AppUserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        JwtService jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void loginRejectsUnknownUsernameWithoutRevealingWhichCredentialFailed() {
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(new AuthRequest("missing", "test123"))
        );

        assertEquals("Invalid username or password", exception.getMessage());
    }

    @Test
    void loginRejectsWrongPasswordWithTheSameMessage() {
        AppUser user = new AppUser();
        user.setUsername("haowen");
        user.setPasswordHash("stored-hash");

        when(userRepository.findByUsername("haowen")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong123", "stored-hash")).thenReturn(false);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(new AuthRequest("haowen", "wrong123"))
        );

        assertEquals("Invalid username or password", exception.getMessage());
    }
}
