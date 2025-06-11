-- Initialize ImagineAI Database Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    image_data TEXT NOT NULL,
    filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at);

-- Insert sample data (optional)
-- You can uncomment these lines to add test data
-- INSERT OR IGNORE INTO users (username, email, password) VALUES 
-- ('testuser', 'test@example.com', '$2b$10$example.hash.here');
