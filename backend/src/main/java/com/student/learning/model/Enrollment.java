package com.student.learning.model;

import jakarta.persistence.*;

@Entity
@Table(name = "enrollments", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
public class Enrollment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enrollmentId;
    @ManyToOne @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    private int progress = 0;

    public Long getEnrollmentId() { return enrollmentId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = Math.max(0, Math.min(100, progress)); }
}
