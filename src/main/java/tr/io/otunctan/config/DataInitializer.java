package tr.io.otunctan.config;

import tr.io.otunctan.entity.Authority;
import tr.io.otunctan.entity.Role;
import tr.io.otunctan.repository.AuthorityRepository;
import tr.io.otunctan.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(RoleRepository roleRepository, AuthorityRepository authorityRepository) {
        return args -> {
            Authority readTodo = authorityRepository.findByName("TODO_READ")
                    .orElseGet(() -> authorityRepository.save(new Authority("TODO_READ")));
            Authority writeTodo = authorityRepository.findByName("TODO_WRITE")
                    .orElseGet(() -> authorityRepository.save(new Authority("TODO_WRITE")));
            Authority deleteTodo = authorityRepository.findByName("TODO_DELETE")
                    .orElseGet(() -> authorityRepository.save(new Authority("TODO_DELETE")));
            Authority manageUsers = authorityRepository.findByName("USER_MANAGE")
                    .orElseGet(() -> authorityRepository.save(new Authority("USER_MANAGE")));

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseGet(() -> {
                        Role role = new Role("ROLE_USER");
                        role.setAuthorities(Set.of(readTodo, writeTodo));
                        return roleRepository.save(role);
                    });

            if (userRole.getAuthorities() == null || userRole.getAuthorities().isEmpty()) {
                userRole.setAuthorities(Set.of(readTodo, writeTodo));
                roleRepository.save(userRole);
            }

            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> {
                        Role role = new Role("ROLE_ADMIN");
                        role.setAuthorities(Set.of(readTodo, writeTodo, deleteTodo, manageUsers));
                        return roleRepository.save(role);
                    });

            if (adminRole.getAuthorities() == null || adminRole.getAuthorities().isEmpty()) {
                adminRole.setAuthorities(Set.of(readTodo, writeTodo, deleteTodo, manageUsers));
                roleRepository.save(adminRole);
            }
        };
    }
}

