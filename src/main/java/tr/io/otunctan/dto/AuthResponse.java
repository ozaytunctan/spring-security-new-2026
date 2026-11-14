package tr.io.otunctan.dto;

import java.util.Set;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String username;
    private Set<String> roles;
    private Set<String> authorities;

    public AuthResponse(String accessToken, String refreshToken, String username, Set<String> roles, Set<String> authorities) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.username = username;
        this.roles = roles;
        this.authorities = authorities;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public String getUsername() {
        return username;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public Set<String> getAuthorities() {
        return authorities;
    }
}

