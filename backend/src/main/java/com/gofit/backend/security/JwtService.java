package com.gofit.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gofit.jwt.secret:GoFitDevelopmentJwtSecretChangeThisBeforeProduction12345}")
    private String jwtSecret;

    @Value("${gofit.jwt.expiration-seconds:86400}")
    private long expirationSeconds;

    public String generateToken(UserDetails userDetails) {
        try {
            long issuedAt = Instant.now().getEpochSecond();
            long expiresAt = issuedAt + expirationSeconds;

            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", userDetails.getUsername());
            payload.put("iat", issuedAt);
            payload.put("exp", expiresAt);

            String encodedHeader = base64UrlEncode(objectMapper.writeValueAsString(header));
            String encodedPayload = base64UrlEncode(objectMapper.writeValueAsString(payload));
            String unsignedToken = encodedHeader + "." + encodedPayload;
            String signature = sign(unsignedToken);

            return unsignedToken + "." + signature;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate JWT token");
        }
    }

    public String extractUsername(String token) {
        return String.valueOf(extractPayload(token).get("sub"));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername())
                    && !isTokenExpired(token)
                    && signatureMatches(token);
        } catch (Exception exception) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Object expiration = extractPayload(token).get("exp");
        long expiresAt = Long.parseLong(String.valueOf(expiration));
        return Instant.now().getEpochSecond() > expiresAt;
    }

    private boolean signatureMatches(String token) {
        String[] tokenParts = token.split("\\.");

        if (tokenParts.length != 3) {
            return false;
        }

        String unsignedToken = tokenParts[0] + "." + tokenParts[1];
        return sign(unsignedToken).equals(tokenParts[2]);
    }

    private Map<String, Object> extractPayload(String token) {
        try {
            String[] tokenParts = token.split("\\.");

            if (tokenParts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT token");
            }

            String payloadJson = new String(
                    Base64.getUrlDecoder().decode(tokenParts[1]),
                    StandardCharsets.UTF_8
            );

            return objectMapper.readValue(payloadJson, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid JWT token");
        }
    }

    private String sign(String unsignedToken) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    jwtSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );

            mac.init(secretKey);
            byte[] signature = mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8));

            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign JWT token");
        }
    }

    private String base64UrlEncode(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
