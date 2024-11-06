-- Create a test user in the next_auth.users table
INSERT INTO next_auth.users (id, name, email, "emailVerified", image)
VALUES 
  (uuid_generate_v4(), 'testuser', 'testuser@example.com', NOW(), 'https://example.com/image.png');