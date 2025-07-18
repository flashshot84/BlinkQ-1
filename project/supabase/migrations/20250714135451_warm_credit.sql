/*
  # Insert sample data for development

  1. Sample Products
    - Electronics, Fashion, Home items
    - Featured and regular products
    - Various price ranges

  2. Admin User
    - Create a default admin user for testing
*/

-- Insert sample products
INSERT INTO products (
  name, slug, description, short_description, price, compare_price, sku, 
  quantity, category_id, brand, images, is_featured, rating, reviews_count
) VALUES
-- Electronics
(
  'Premium Wireless Headphones',
  'premium-wireless-headphones',
  'Experience crystal-clear audio with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort padding. Perfect for music lovers, professionals, and travelers.',
  'Premium wireless headphones with noise cancellation',
  2999.00,
  3999.00,
  'WH-001',
  50,
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'AudioTech',
  '["https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  true,
  4.5,
  128
),
(
  'Smart Fitness Watch',
  'smart-fitness-watch',
  'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Compatible with iOS and Android.',
  'Advanced smartwatch with fitness tracking',
  4999.00,
  6999.00,
  'SW-002',
  30,
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'FitTech',
  '["https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  true,
  4.3,
  89
),
(
  'Wireless Bluetooth Speaker',
  'wireless-bluetooth-speaker',
  'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life. Perfect for outdoor adventures and home entertainment.',
  'Portable waterproof Bluetooth speaker',
  1499.00,
  1999.00,
  'BS-003',
  75,
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'SoundWave',
  '["https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.2,
  156
),
(
  'Gaming Mechanical Keyboard',
  'gaming-mechanical-keyboard',
  'Professional gaming keyboard with RGB backlighting, mechanical switches, and programmable keys. Built for competitive gaming and productivity.',
  'RGB mechanical gaming keyboard',
  3499.00,
  4499.00,
  'KB-004',
  25,
  (SELECT id FROM categories WHERE slug = 'electronics'),
  'GamePro',
  '["https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.7,
  203
),

-- Fashion
(
  'Organic Cotton T-Shirt',
  'organic-cotton-t-shirt',
  'Comfortable and sustainable organic cotton t-shirt made from 100% certified organic cotton. Soft, breathable, and perfect for everyday wear.',
  'Sustainable organic cotton t-shirt',
  899.00,
  1299.00,
  'TS-005',
  100,
  (SELECT id FROM categories WHERE slug = 'fashion'),
  'EcoWear',
  '["https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  true,
  4.6,
  312
),
(
  'Denim Jacket',
  'denim-jacket',
  'Classic denim jacket made from premium quality denim. Timeless style that pairs well with any outfit. Available in multiple sizes.',
  'Classic premium denim jacket',
  2499.00,
  3499.00,
  'DJ-006',
  40,
  (SELECT id FROM categories WHERE slug = 'fashion'),
  'UrbanStyle',
  '["https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.4,
  87
),
(
  'Running Shoes',
  'running-shoes',
  'Professional running shoes with advanced cushioning technology, breathable mesh upper, and durable rubber outsole. Perfect for daily runs and workouts.',
  'Professional running shoes with cushioning',
  3999.00,
  5999.00,
  'RS-007',
  60,
  (SELECT id FROM categories WHERE slug = 'fashion'),
  'RunFast',
  '["https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  true,
  4.8,
  445
),

-- Home & Garden
(
  'Ceramic Coffee Mug Set',
  'ceramic-coffee-mug-set',
  'Beautiful set of 4 ceramic coffee mugs with elegant design. Microwave and dishwasher safe. Perfect for your morning coffee or tea.',
  'Set of 4 elegant ceramic coffee mugs',
  799.00,
  1199.00,
  'CM-008',
  80,
  (SELECT id FROM categories WHERE slug = 'home-garden'),
  'HomeEssentials',
  '["https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.3,
  167
),
(
  'Indoor Plant Pot Set',
  'indoor-plant-pot-set',
  'Set of 3 modern ceramic plant pots with drainage holes and saucers. Perfect for indoor plants and home decoration.',
  'Set of 3 modern ceramic plant pots',
  1299.00,
  1799.00,
  'PP-009',
  45,
  (SELECT id FROM categories WHERE slug = 'home-garden'),
  'GreenHome',
  '["https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.1,
  92
),

-- Books
(
  'The Complete Guide to Web Development',
  'complete-guide-web-development',
  'Comprehensive guide covering HTML, CSS, JavaScript, React, and modern web development practices. Perfect for beginners and intermediate developers.',
  'Complete web development guide book',
  1499.00,
  1999.00,
  'BK-010',
  35,
  (SELECT id FROM categories WHERE slug = 'books'),
  'TechBooks',
  '["https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.7,
  234
),

-- Sports & Fitness
(
  'Yoga Mat Premium',
  'yoga-mat-premium',
  'Premium non-slip yoga mat made from eco-friendly materials. Extra thick for comfort and stability during yoga and fitness exercises.',
  'Premium eco-friendly yoga mat',
  1999.00,
  2999.00,
  'YM-011',
  55,
  (SELECT id FROM categories WHERE slug = 'sports-fitness'),
  'FitLife',
  '["https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  true,
  4.5,
  178
),

-- Beauty & Health
(
  'Natural Face Serum',
  'natural-face-serum',
  'Organic face serum with vitamin C and hyaluronic acid. Helps reduce fine lines, brightens skin, and provides deep hydration.',
  'Organic vitamin C face serum',
  2499.00,
  3499.00,
  'FS-012',
  70,
  (SELECT id FROM categories WHERE slug = 'beauty-health'),
  'NaturalGlow',
  '["https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=800"]',
  false,
  4.6,
  289
)
ON CONFLICT (sku) DO NOTHING;