-- Local only: CREATE DATABASE online_learning; USE online_learning;
-- On Aiven, run this inside the default database (defaultdb).
CREATE DATABASE IF NOT EXISTS online_learning;
USE online_learning;
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  course_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  instructor VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_enrollment_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(course_id),
  CONSTRAINT unique_user_course UNIQUE (user_id, course_id)
);

INSERT INTO courses (course_name, description, instructor) VALUES
('React Basics', 'Learn components, props, state, and simple React applications.', 'Ananya Rao'),
('Java Fundamentals', 'Understand classes, objects, methods, and core Java concepts.', 'Rahul Sharma'),
('SQL Essentials', 'Practice SELECT queries, filtering, joins, and database basics.', 'Priya Nair'),
('Web Design Basics', 'Learn HTML, CSS, layouts, and responsive page design.', 'Kiran Kumar'),
('Python Introduction', 'Start with variables, conditions, loops, and functions in Python.', 'Meera Das');
