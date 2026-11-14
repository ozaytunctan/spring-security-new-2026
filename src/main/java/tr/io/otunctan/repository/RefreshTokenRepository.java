package tr.io.otunctan.repository;

import tr.io.otunctan.entity.RefreshToken;
import tr.io.otunctan.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}

