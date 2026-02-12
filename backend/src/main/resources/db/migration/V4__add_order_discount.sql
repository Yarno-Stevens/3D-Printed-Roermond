-- Add discount fields to orders table
ALTER TABLE orders ADD COLUMN discount_percentage DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0.00;

