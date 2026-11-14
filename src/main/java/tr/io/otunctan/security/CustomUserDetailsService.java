package tr.io.otunctan.security;

import tr.io.otunctan.entity.User;
import tr.io.otunctan.repository.UserRepository;
import tr.io.otunctan.service.CacheService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    public static final String USERS_CACHE = "usersByUsername";

    private final UserRepository userRepository;
    private final CacheService cacheService;

    public CustomUserDetailsService(UserRepository userRepository, CacheService cacheService) {
        this.userRepository = userRepository;
        this.cacheService = cacheService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1) Cache'ten oku (hit/miss)
        Optional<CustomUserDetails> cached = cacheService.get(USERS_CACHE, username, CustomUserDetails.class);
        if (cached.isPresent()) {
            return cached.get();
        }

        // 2) Cache miss -> DB'den yükle
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        CustomUserDetails userDetails = new CustomUserDetails(user);

        // 3) Cache'e yaz
        cacheService.put(USERS_CACHE, username, userDetails);

        return userDetails;
    }

    public void evictUserCache(String username) {
        cacheService.evict(USERS_CACHE, username);
    }
}

