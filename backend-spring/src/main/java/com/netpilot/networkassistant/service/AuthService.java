package com.netpilot.networkassistant.service;

import com.netpilot.networkassistant.dto.auth.AuthResponse;
import com.netpilot.networkassistant.dto.auth.RegisterRequest;
import com.netpilot.networkassistant.entity.Role;
import com.netpilot.networkassistant.entity.User;
import com.netpilot.networkassistant.exception.UserAlreadyExistsException;
import com.netpilot.networkassistant.repository.UserRepository;
import com.netpilot.networkassistant.dto.auth.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.netpilot.networkassistant.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());

        return AuthResponse.builder()
                .message("User Registered Successfully")
                .token(token)
                .build();
    }

    public AuthResponse login(LoginRequest request) {

    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() ->
                    new RuntimeException("Invalid credentials"));

    if (!passwordEncoder.matches(
            request.getPassword(),
            user.getPassword())) {

        throw new RuntimeException("Invalid credentials");
    }

    String token = jwtService.generateToken(user.getEmail());

    return AuthResponse.builder()
            .message("Login Successful")
            .token(token)
            .build();
    }

}