package com.student.learning.controller;

import com.student.learning.model.*;
import com.student.learning.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final UserRepository users;
    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public ApiController(UserRepository users, CourseRepository courses, EnrollmentRepository enrollments) {
        this.users = users; this.courses = courses; this.enrollments = enrollments;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        if (name.isBlank() || email.isBlank() || password.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "All fields are required."));
        if (users.findByEmail(email).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered."));
        User user = new User(); user.setName(name); user.setEmail(email); user.setPassword(encoder.encode(password));
        users.save(user);
        return ResponseEntity.ok(userView(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        Optional<User> found = users.findByEmail(email);
        if (found.isEmpty() || !encoder.matches(password, found.get().getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
        return ResponseEntity.ok(userView(found.get()));
    }

    @GetMapping("/courses")
    public List<Course> allCourses() { return courses.findAll(); }

    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(@RequestBody Map<String, Long> body) {
        Long userId = body.get("userId"), courseId = body.get("courseId");
        if (userId == null || courseId == null) return ResponseEntity.badRequest().body(Map.of("message", "userId and courseId are required."));
        Optional<User> user = users.findById(userId);
        Optional<Course> course = courses.findById(courseId);
        if (user.isEmpty() || course.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "User or course not found."));
        if (enrollments.findByUser_UserIdAndCourse_CourseId(userId, courseId).isPresent())
            return ResponseEntity.ok(Map.of("message", "Already enrolled."));
        Enrollment enrollment = new Enrollment(); enrollment.setUser(user.get()); enrollment.setCourse(course.get());
        enrollments.save(enrollment);
        return ResponseEntity.ok(Map.of("message", "Enrollment successful."));
    }

    @GetMapping("/enrollments/{userId}")
    public List<Map<String, Object>> myEnrollments(@PathVariable Long userId) {
        return enrollments.findByUser_UserId(userId).stream().map(e -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("enrollmentId", e.getEnrollmentId());
            row.put("course", e.getCourse());
            row.put("progress", e.getProgress());
            return row;
        }).toList();
    }

    @PostMapping("/progress")
    public ResponseEntity<?> updateProgress(@RequestBody Map<String, Integer> body) {
        Integer enrollmentId = body.get("enrollmentId"), progress = body.get("progress");
        if (enrollmentId == null || progress == null) return ResponseEntity.badRequest().body(Map.of("message", "Required fields missing."));
        Optional<Enrollment> found = enrollments.findById(enrollmentId.longValue());
        if (found.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Enrollment not found."));
        found.get().setProgress(progress); enrollments.save(found.get());
        return ResponseEntity.ok(Map.of("message", "Progress updated.", "progress", found.get().getProgress()));
    }

    private Map<String, Object> userView(User user) {
        return Map.of("userId", user.getUserId(), "name", user.getName(), "email", user.getEmail());
    }
}
