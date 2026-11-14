package tr.io.otunctan.service;

import tr.io.otunctan.dto.*;
import tr.io.otunctan.entity.RefreshToken;
import tr.io.otunctan.entity.Role;
import tr.io.otunctan.entity.User;
import tr.io.otunctan.repository.RoleRepository;
import tr.io.otunctan.repository.UserRepository;
import tr.io.otunctan.security.CustomUserDetails;
import tr.io.otunctan.security.CustomUserDetailsService;
import tr.io.otunctan.security.JwtService;
import tr.io.otunctan.service.CacheService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CustomUserDetailsService userDetailsService;
    private final CacheService cacheService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       CustomUserDetailsService userDetailsService,
                       CacheService cacheService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userDetailsService = userDetailsService;
        this.cacheService = cacheService;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);
        userRepository.save(user);

        // Olası eski/negatif cache kayıtlarını temizle (cache hatası uygulamayı bozmaz)
        cacheService.evict(CustomUserDetailsService.USERS_CACHE, request.getUsername());

        return new MessageResponse("User registered successfully");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(principal.getId());

        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .collect(Collectors.toSet());
        Set<String> authorities = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .collect(Collectors.toSet());

        return new AuthResponse(accessToken, refreshToken.getToken(), principal.getUsername(), roles, authorities);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        User user = refreshToken.getUser();

        // rotate refresh token
        refreshTokenService.revokeByToken(refreshToken.getToken());
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtService.generateAccessToken(userDetails);

        Set<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .collect(Collectors.toSet());
        Set<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .collect(Collectors.toSet());

        return new AuthResponse(accessToken, newRefreshToken.getToken(), user.getUsername(), roles, authorities);
    }

    @Transactional
    public MessageResponse logout(RefreshTokenRequest request) {
        refreshTokenService.revokeByToken(request.getRefreshToken());
        return new MessageResponse("Logged out successfully");
    }

    private Set<Role> resolveRoles(Set<String> requestedRoles) {
        Set<Role> roles = new HashSet<>();
        if (requestedRoles == null || requestedRoles.isEmpty()) {
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new IllegalStateException("Default role ROLE_USER is not configured"));
            roles.add(userRole);
            return roles;
        }

        for (String roleName : requestedRoles) {
            String normalized = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName.toUpperCase();
            Role role = roleRepository.findByName(normalized)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + normalized));
            roles.add(role);
        }
        return roles;
    }
}

