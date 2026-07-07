package com.netpilot.networkassistant.controller;

import com.netpilot.networkassistant.dto.auth.AuthResponse;
import com.netpilot.networkassistant.dto.auth.LoginRequest;
import com.netpilot.networkassistant.dto.auth.RegisterRequest;
import com.netpilot.networkassistant.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }
}