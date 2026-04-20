CREATE DATABASE IF NOT EXISTS `rosellea_db`;
USE `rosellea_db`;

DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `stock_requests`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `address` TEXT,
    `role` ENUM('admin', 'seller', 'customer') DEFAULT 'customer',
    `user_status` ENUM('pending', 'active', 'rejected') DEFAULT 'active',
    `company_name` VARCHAR(255) DEFAULT NULL,
    `company_description` TEXT DEFAULT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `stock_quantity` INT DEFAULT 0,
    `in_stock` TINYINT(1) DEFAULT 1,
    `status` ENUM('pending', 'active', 'rejected') DEFAULT 'active',
    `seller_id` INT DEFAULT NULL,
    `description` TEXT,
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `stock_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `seller_id` INT NOT NULL,
    `requested_quantity` INT NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `customer_name` VARCHAR(255) NOT NULL,
    `address` TEXT NOT NULL,
    `total_price` DECIMAL(10,2) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `price_at_purchase` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
);

INSERT INTO `products` (`name`, `category`, `brand`, `price`, `image_url`, `description`) VALUES
('Hydra Glow Serum', 'Serum and essence', 'GlowTech', 45.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Deep hydration for all day luminous skin.'),
('Vitamin C Rejuvenate', 'Serum and essence', 'Aura Skincare', 55.00, 'https://images.unsplash.com/photo-1608289178820-2dfaa443cb00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Brighten your dark spots with 15% Vitamin C.'),
('Daily Defense Cream', 'Face moisturizer and day cream', 'Aura Skincare', 35.00, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Lightweight and deeply nourishing formula.'),
('Ultra Moisture Day Repair', 'Face moisturizer and day cream', 'Luxe Botanicals', 42.00, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Rich texture for dry skin comfort.'),
('Sun Shield SPF 50', 'Suncare', 'SunSafe', 25.00, 'https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Non-greasy sun protection with UVA/UVB filters.'),
('Invisible Matte SPF 40', 'Suncare', 'SunSafe', 28.00, 'https://images.unsplash.com/photo-1556228720-1c27bef92244?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Transparent gel sunscreen that leaves no white cast.'),
('Revitalizing Amino Shampoo', 'Shampoo', 'HairVitals', 18.00, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'For smooth and silky hair full of life.'),
('Deep Cleanse Scalp Wash', 'Shampoo', 'Pure Roots', 20.00, 'https://images.unsplash.com/photo-1629198688000-71f23e74567c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Clarifying shampoo for oily scalps.'),
('Matte Velvet Lipstick - Crimson', 'Lips', 'Glamour Cosmetics', 22.00, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Long-lasting rich color with a velvety finish.'),
('Glossy Pink Lip Tint', 'Lips', 'Luxe Botanicals', 18.00, 'https://images.unsplash.com/photo-1599305090598-fe179d501227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'A subtle pop of pink with high shine.'),
('Gentle Foaming Face Wash', 'Face wash', 'GlowTech', 15.00, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Removes daily impurities gently without stripping.'),
('Charcoal Detox Cleanser', 'Face wash', 'Pure Roots', 17.00, 'https://images.unsplash.com/photo-1556229162-5c63ed9c4ea4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Deep pore cleansing for acne-prone skin.'),
('Rose Hydration Lip Balm', 'Lip balm', 'Nature Extract', 12.00, 'https://images.unsplash.com/photo-1599305090598-fe179d501227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Soft and supple lips instantly with real rose extract.'),
('Mint Cooling Lip Butter', 'Lip balm', 'Nature Extract', 10.00, 'https://images.unsplash.com/photo-1629198725964-b816ce0360ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Cooling sensation with deep shea butter repair.'),
('Intense Black Kajal Pencil', 'Kajal', 'Glamour Cosmetics', 10.00, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Smudge-proof all-day wear for dramatic eyes.'),
('Tropical Breeze Shower Gel', 'Shower gel and body wash', 'Nature Extract', 16.00, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Refreshing body wash for a great morning start.'),
('Lavender Calm Body Wash', 'Shower gel and body wash', 'Luxe Botanicals', 19.00, 'https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 'Relaxing nighttime routine body cleanser.');

-- Default Admin User (Password: admin123)
-- Hash for 'admin123'
INSERT INTO `users` (`full_name`, `email`, `password`, `role`) VALUES 
('System Admin', 'admin@rosellea.com', '$2y$12$CmLtl3NCEZH3CG0NN3TBq.fS8LYAyBqltdgspZ2hYaR3MmT6QAT0u', 'admin');
