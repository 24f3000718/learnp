package com.student.learning.repository;

import com.student.learning.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUser_UserId(Long userId);
    Optional<Enrollment> findByUser_UserIdAndCourse_CourseId(Long userId, Long courseId);
}
