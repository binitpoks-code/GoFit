package com.gofit.backend.dto;

public class AuthenticationResponseDTO {

    private String token;
    private String email;
    private String username;
    private boolean authenticated;

    public AuthenticationResponseDTO(
            String token,
            String email,
            String username,
            boolean authenticated
    ) {
        this.token = token;
        this.email = email;
        this.username = username;
        this.authenticated = authenticated;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }
}
