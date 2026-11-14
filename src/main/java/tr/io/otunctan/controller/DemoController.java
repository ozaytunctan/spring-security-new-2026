package tr.io.otunctan.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    @GetMapping("/profile")
    public Map<String, String> profile() {
        return Map.of("message", "Authenticated user can access this endpoint");
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER')")
    public Map<String, String> userArea() {
        return Map.of("message", "ROLE_USER access granted");
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminArea() {
        return Map.of("message", "ROLE_ADMIN access granted");
    }

    @GetMapping("/todo/write")
    @PreAuthorize("hasAuthority('TODO_WRITE')")
    public Map<String, String> writeTodo() {
        return Map.of("message", "TODO_WRITE authority granted");
    }
}

