import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('devices').del();

    // Inserts seed entries
    await knex('devices').insert([
        // Laptops
        {
            brand: 'Apple',
            model: 'MacBook Pro 16-inch',
            category: 'Laptop',
            description: '16-inch MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'MacBook Air M2',
            category: 'Laptop',
            description: '13-inch MacBook Air with M2 chip, 8GB RAM, 256GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Dell',
            model: 'XPS 13',
            category: 'Laptop',
            description: 'Dell XPS 13 Ultrabook, Intel Core i7, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Dell',
            model: 'Latitude 5520',
            category: 'Laptop',
            description: 'Dell Latitude 5520 Business Laptop, Intel Core i5, 8GB RAM, 256GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Lenovo',
            model: 'ThinkPad X1 Carbon',
            category: 'Laptop',
            description: 'Lenovo ThinkPad X1 Carbon Gen 10, Intel Core i7, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Lenovo',
            model: 'Yoga 9i',
            category: 'Laptop',
            description: 'Lenovo Yoga 9i 2-in-1 Convertible Laptop, Intel Core i7, 16GB RAM, 1TB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'HP',
            model: 'Spectre x360',
            category: 'Laptop',
            description: 'HP Spectre x360 2-in-1 Laptop, Intel Core i7, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Asus',
            model: 'ZenBook 14',
            category: 'Laptop',
            description: 'ASUS ZenBook 14 Ultrabook, AMD Ryzen 7, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Acer',
            model: 'Swift 3',
            category: 'Laptop',
            description: 'Acer Swift 3 Laptop, Intel Core i5, 8GB RAM, 256GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Microsoft',
            model: 'Surface Laptop 5',
            category: 'Laptop',
            description: 'Microsoft Surface Laptop 5, Intel Core i7, 16GB RAM, 512GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Tablets
        {
            brand: 'Apple',
            model: 'iPad Pro 12.9-inch',
            category: 'Tablet',
            description: '12.9-inch iPad Pro with M2 chip, 256GB storage, Wi-Fi + Cellular',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'iPad Air',
            category: 'Tablet',
            description: '10.9-inch iPad Air with M1 chip, 256GB storage, Wi-Fi',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Samsung',
            model: 'Galaxy Tab S8',
            category: 'Tablet',
            description: 'Samsung Galaxy Tab S8, 11-inch display, 128GB storage, Wi-Fi',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Microsoft',
            model: 'Surface Pro 9',
            category: 'Tablet',
            description: 'Microsoft Surface Pro 9, Intel Core i7, 16GB RAM, 256GB SSD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Lenovo',
            model: 'Tab P11 Pro',
            category: 'Tablet',
            description: 'Lenovo Tab P11 Pro, 11.5-inch OLED display, 128GB storage',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Smartphones
        {
            brand: 'Apple',
            model: 'iPhone 15 Pro',
            category: 'Smartphone',
            description: 'iPhone 15 Pro, 256GB storage, 6.1-inch display',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'iPhone 14',
            category: 'Smartphone',
            description: 'iPhone 14, 128GB storage, 6.1-inch display',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Samsung',
            model: 'Galaxy S23 Ultra',
            category: 'Smartphone',
            description: 'Samsung Galaxy S23 Ultra, 256GB storage, 6.8-inch display',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Samsung',
            model: 'Galaxy A54',
            category: 'Smartphone',
            description: 'Samsung Galaxy A54, 128GB storage, 6.4-inch display',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Google',
            model: 'Pixel 8 Pro',
            category: 'Smartphone',
            description: 'Google Pixel 8 Pro, 256GB storage, 6.7-inch display',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Monitors
        {
            brand: 'Dell',
            model: 'UltraSharp U2720Q',
            category: 'Monitor',
            description: '27-inch 4K UHD Monitor, USB-C connectivity',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'LG',
            model: '27UN850-W',
            category: 'Monitor',
            description: '27-inch 4K UHD IPS Monitor, USB-C connectivity',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Samsung',
            model: 'Odyssey G7',
            category: 'Monitor',
            description: '32-inch QHD Curved Gaming Monitor, 240Hz refresh rate',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Printers
        {
            brand: 'HP',
            model: 'LaserJet Pro M404dn',
            category: 'Printer',
            description: 'HP LaserJet Pro M404dn Monochrome Laser Printer',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Canon',
            model: 'PIXMA TR8620',
            category: 'Printer',
            description: 'Canon PIXMA TR8620 All-in-One Wireless Inkjet Printer',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Projectors
        {
            brand: 'Epson',
            model: 'PowerLite X41+',
            category: 'Projector',
            description: 'Epson PowerLite X41+ Portable Projector, 3600 lumens',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'BenQ',
            model: 'MW560',
            category: 'Projector',
            description: 'BenQ MW560 Business Projector, 3600 lumens, Full HD',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Headphones
        {
            brand: 'Sony',
            model: 'WH-1000XM5',
            category: 'Headphones',
            description: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'AirPods Pro',
            category: 'Headphones',
            description: 'Apple AirPods Pro (2nd generation) with Active Noise Cancellation',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Bose',
            model: 'QuietComfort 45',
            category: 'Headphones',
            description: 'Bose QuietComfort 45 Wireless Noise Cancelling Headphones',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Keyboards
        {
            brand: 'Logitech',
            model: 'MX Keys',
            category: 'Keyboard',
            description: 'Logitech MX Keys Wireless Illuminated Keyboard',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'Magic Keyboard',
            category: 'Keyboard',
            description: 'Apple Magic Keyboard with Numeric Keypad',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Mice
        {
            brand: 'Logitech',
            model: 'MX Master 3S',
            category: 'Mouse',
            description: 'Logitech MX Master 3S Wireless Mouse',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Apple',
            model: 'Magic Mouse',
            category: 'Mouse',
            description: 'Apple Magic Mouse - Multi-Touch Surface',
            default_loan_duration_days: 2,
            is_deleted: false,
        },

        // Cameras
        {
            brand: 'Canon',
            model: 'EOS R6 Mark II',
            category: 'Camera',
            description: 'Canon EOS R6 Mark II Mirrorless Camera Body',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Sony',
            model: 'Alpha 7 IV',
            category: 'Camera',
            description: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
        {
            brand: 'Nikon',
            model: 'Z6 III',
            category: 'Camera',
            description: 'Nikon Z6 III Full-Frame Mirrorless Camera',
            default_loan_duration_days: 2,
            is_deleted: false,
        },
    ]);
}

