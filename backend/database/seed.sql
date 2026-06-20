-- Seed Data for Authentication Module

-- 1. Insert Admin User
-- Password: admin123 (hashed with bcrypt: $2b$10$lU2n1lW.9QhV53E0r55/qep5lG7sLqIexGkI3o0oW5jWpPpe11iR6)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@odoo.com', '$2b$10$lU2n1lW.9QhV53E0r55/qep5lG7sLqIexGkI3o0oW5jWpPpe11iR6', 'ADMIN');
