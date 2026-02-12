-- Add discount column to customers table
ALTER TABLE customers ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;

