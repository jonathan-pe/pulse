-- Create a test user in the users table
insert into users (id, name, email) 
values (uuid_generate_v4(), 'Test User', 'test@test.com');