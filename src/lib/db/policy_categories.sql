CREATE TABLE policy_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO policy_categories (name, description) VALUES
('HR Policies', 'Human Resources policies and procedures'),
('Benefits', 'Employee benefits and compensation'),
('Remote Work', 'Remote work policies and guidelines'),
('Time Off', 'Vacation, sick leave, and time off policies'),
('Code of Conduct', 'Behavioral guidelines and ethics'),
('Compliance', 'Legal and regulatory compliance'),
('Training', 'Training and development policies'),
('Security', 'Information security and data protection');
