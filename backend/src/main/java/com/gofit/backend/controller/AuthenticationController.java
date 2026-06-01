package com.gofit.backend.controller;

import com.gofit.backend.dto.AuthenticationResponseDTO;
import com.gofit.backend.dto.ChangePasswordRequest;
import com.gofit.backend.dto.LoginRequestDTO;
import com.gofit.backend.dto.RegisterRequestDTO;
import com.gofit.backend.service.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public AuthenticationResponseDTO register(@Valid @RequestBody RegisterRequestDTO request) {
        return authenticationService.register(request);
    }

    @PostMapping("/login")
    public AuthenticationResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authenticationService.login(request);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest req,
            Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        try {
            authenticationService.changePassword(auth.getName(), req.getCurrentPassword(), req.getNewPassword());
            return ResponseEntity.ok("Password updated successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
