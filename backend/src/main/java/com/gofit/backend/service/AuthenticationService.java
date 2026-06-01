package com.gofit.backend.service;

import com.gofit.backend.dto.AuthenticationResponseDTO;
import com.gofit.backend.dto.LoginRequestDTO;
import com.gofit.backend.dto.RegisterRequestDTO;
import com.gofit.backend.model.UserAccount;
import com.gofit.backend.repository.UserAccountRepository;
import com.gofit.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthenticationResponseDTO register(RegisterRequestDTO request) {
        if (userAccountRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account already exists with this email.");
        }

        UserAccount userAccount = new UserAccount(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );

        UserAccount savedAccount = userAccountRepository.save(userAccount);
        String token = jwtService.generateToken(savedAccount);

        return new AuthenticationResponseDTO(
                token,
                savedAccount.getEmail(),
                savedAccount.getDisplayUsername(),
                true
        );
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        UserAccount user = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userAccountRepository.save(user);
    }

    public AuthenticationResponseDTO login(LoginRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        UserAccount userAccount = userAccountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        String token = jwtService.generateToken(userAccount);

        return new AuthenticationResponseDTO(
                token,
                userAccount.getEmail(),
                userAccount.getDisplayUsername(),
                true
        );
    }
}
