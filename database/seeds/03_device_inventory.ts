import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('device_inventory').del();

    // Get all devices
    const devices = await knex('devices').select('device_id', 'brand', 'model', 'category');

    // Generate inventory items for each device
    const inventoryItems: Array<{
        device_id: string;
        serial_number: string;
        is_available: boolean;
    }> = [];

    // Helper function to generate serial number
    const generateSerialNumber = (brand: string, model: string, index: number): string => {
        const brandPrefix = brand.substring(0, 3).toUpperCase();
        const modelPrefix = model.replace(/\s+/g, '').substring(0, 4).toUpperCase();
        const paddedIndex = String(index).padStart(4, '0');
        return `${brandPrefix}-${modelPrefix}-${paddedIndex}`;
    };

    // Create inventory items for each device
    // More inventory items for popular devices (laptops, tablets, smartphones)
    devices.forEach((device) => {
        let itemCount = 2; // Default 2 items per device

        // Adjust count based on category
        if (device.category === 'Laptop' || device.category === 'Tablet' || device.category === 'Smartphone') {
            itemCount = 5; // 5 items for popular devices
        } else if (device.category === 'Monitor' || device.category === 'Camera') {
            itemCount = 3; // 3 items for monitors and cameras
        } else {
            itemCount = 2; // 2 items for other devices
        }

        // Create inventory items
        for (let i = 1; i <= itemCount; i++) {
            const serialNumber = generateSerialNumber(device.brand, device.model, i);
            // Mix of available and unavailable items (about 70% available)
            const isAvailable = i <= Math.ceil(itemCount * 0.7);

            inventoryItems.push({
                device_id: device.device_id,
                serial_number: serialNumber,
                is_available: isAvailable,
            });
        }
    });

    // Insert all inventory items
    await knex('device_inventory').insert(inventoryItems);
}

