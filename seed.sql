-- Seed basic categories
INSERT INTO "Category" (id, name, description) VALUES 
(gen_random_uuid(), 'Electronics', 'Gadgets and electronic devices'),
(gen_random_uuid(), 'Furniture', 'Office and home furniture'),
(gen_random_uuid(), 'Office Supplies', 'Stationary and general office items')
ON CONFLICT (name) DO NOTHING;
