package tr.io.otunctan.security;

import tr.io.otunctan.entity.Role;
import tr.io.otunctan.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class CustomUserDetails implements UserDetails, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String username;
    private final String email;
    private final String password;
    private final boolean enabled;
    private final Set<SimpleGrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.enabled = user.isEnabled();
        this.authorities = buildAuthorities(user.getRoles());
    }

    private static Set<SimpleGrantedAuthority> buildAuthorities(Set<Role> roles) {
        Set<SimpleGrantedAuthority> result = new HashSet<>();
        if (roles == null) {
            return result;
        }
        for (Role role : roles) {
            result.add(new SimpleGrantedAuthority(role.getName()));
            if (role.getAuthorities() != null) {
                role.getAuthorities().forEach(auth ->
                        result.add(new SimpleGrantedAuthority(auth.getName())));
            }
        }
        return result;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

