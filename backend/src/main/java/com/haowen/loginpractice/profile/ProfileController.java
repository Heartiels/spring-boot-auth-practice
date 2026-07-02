package com.haowen.loginpractice.profile;

import com.haowen.loginpractice.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return new ProfileResponse(user.userId(), user.username());
    }
}
