const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper to generate random date in the past N days
function randomPastDate(daysAgo) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
    return date
}

// Helper to generate random int between min and max
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
    console.log('🌱 Starting database seeding...')

    // 1. USERS
    console.log('👤 Seeding users...')
    const password = await bcrypt.hash('admin123', 10)

    const owner = await prisma.user.upsert({
        where: { email: 'owner@tokoroti.com' },
        update: {},
        create: {
            email: 'owner@tokoroti.com',
            name: 'Bambang Sutejo',
            password,
            role: 'OWNER',
            phone: '081234567890',
        },
    })

    const manager = await prisma.user.upsert({
        where: { email: 'manager@tokoroti.com' },
        update: {},
        create: {
            email: 'manager@tokoroti.com',
            name: 'Siti Nurhaliza',
            password,
            role: 'MANAGER',
            phone: '081234567891',
        },
    })

    const kasir1 = await prisma.user.upsert({
        where: { email: 'kasir1@tokoroti.com' },
        update: {},
        create: {
            email: 'kasir1@tokoroti.com',
            name: 'Ahmad Fauzi',
            password,
            role: 'KASIR',
            phone: '081234567892',
        },
    })

    const kasir2 = await prisma.user.upsert({
        where: { email: 'kasir2@tokoroti.com' },
        update: {},
        create: {
            email: 'kasir2@tokoroti.com',
            name: 'Dewi Kartika',
            password,
            role: 'KASIR',
            phone: '081234567893',
        },
    })

    console.log('✅ Users seeded!')

    // 2. SETTINGS
    console.log('⚙️  Seeding settings...')
    await prisma.settings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            businessName: 'Toko Roti Bahagia',
            businessAddress: 'Jl. Mawar No. 123, Jakarta Selatan 12160',
            businessPhone: '021-7654321',
            businessEmail: 'info@tokorotibahagia.com',
            taxRate: 11,
            taxIncluded: false,
            currency: 'IDR',
            receiptHeader: '🍞 TOKO ROTI BAHAGIA 🍞\nTerima kasih telah berbelanja!',
            receiptFooter: 'Follow IG: @tokorotibahagia\nBuka: 06:00 - 21:00 WIB',
            lowStockThreshold: 10,
            ownerPhone: '081234567890',
        },
    })
    console.log('✅ Settings seeded!')

    // 3. CATEGORIES
    console.log('📁 Seeding categories...')
    const categories = [
        { id: 'roti-manis', name: 'Roti Manis', description: 'Berbagai jenis roti manis', icon: '🍞', color: '#FFB347' },
        { id: 'roti-tawar', name: 'Roti Tawar', description: 'Roti tawar berbagai varian', icon: '🥪', color: '#F5DEB3' },
        { id: 'kue', name: 'Kue', description: 'Berbagai jenis kue', icon: '🍰', color: '#FFB6C1' },
        { id: 'pastry', name: 'Pastry', description: 'Croissant, danish, dll', icon: '🥐', color: '#DEB887' },
        { id: 'donat', name: 'Donat', description: 'Berbagai jenis donat', icon: '🍩', color: '#D2691E' },
        { id: 'minuman', name: 'Minuman', description: 'Kopi, teh, dan minuman lainnya', icon: '☕', color: '#8B4513' },
    ]

    const createdCategories = {}
    for (const cat of categories) {
        const category = await prisma.category.upsert({
            where: { id: cat.id },
            update: cat,
            create: cat,
        })
        createdCategories[cat.id] = category
    }
    console.log('✅ Categories seeded!')

    // 4. SUPPLIERS
    console.log('🚚 Seeding suppliers...')
    const suppliers = [
        { id: 'supp-001', name: 'PT Tepung Bogasari', phone: '021-5551234', address: 'Jakarta' },
        { id: 'supp-002', name: 'CV Gula Manis', phone: '021-5551235', address: 'Bandung' },
        { id: 'supp-003', name: 'Toko Bahan Kue Sukses', phone: '021-5551236', address: 'Jakarta' },
        { id: 'supp-004', name: 'UD Telur Segar', phone: '021-5551237', address: 'Bogor' },
    ]

    const createdSuppliers = []
    for (const sup of suppliers) {
        const supplier = await prisma.supplier.upsert({
            where: { id: sup.id },
            update: { ...sup, isActive: true },
            create: { ...sup, isActive: true },
        })
        createdSuppliers.push(supplier)
    }
    console.log('✅ Suppliers seeded!')

    // 5. RAW MATERIALS
    console.log('📦 Seeding raw materials...')
    const rawMaterials = [
        { name: 'Tepung Terigu', sku: 'RM-001', unit: 'kg', stock: 150, minStock: 50, cost: 12000 },
        { name: 'Gula Pasir', sku: 'RM-002', unit: 'kg', stock: 80, minStock: 20, cost: 15000 },
        { name: 'Mentega', sku: 'RM-003', unit: 'kg', stock: 40, minStock: 10, cost: 45000 },
        { name: 'Telur Ayam', sku: 'RM-004', unit: 'kg', stock: 60, minStock: 15, cost: 28000 },
        { name: 'Ragi Instan', sku: 'RM-005', unit: 'kg', stock: 10, minStock: 3, cost: 85000 },
        { name: 'Susu Bubuk', sku: 'RM-006', unit: 'kg', stock: 30, minStock: 10, cost: 65000 },
        { name: 'Coklat Chips', sku: 'RM-007', unit: 'kg', stock: 25, minStock: 8, cost: 95000 },
        { name: 'Keju Parut', sku: 'RM-008', unit: 'kg', stock: 15, minStock: 5, cost: 110000 },
    ]

    for (const rm of rawMaterials) {
        await prisma.rawMaterial.upsert({
            where: { sku: rm.sku },
            update: rm,
            create: { 
                ...rm, 
                stock: rm.stock,
                minStock: rm.minStock,
                cost: rm.cost,
                supplier: createdSuppliers[randomInt(0, createdSuppliers.length - 1)].name,
            },
        })
    }
    console.log('✅ Raw materials seeded!')

    // 6. PRODUCTS
    console.log('🍞 Seeding products...')
    const products = [
        // Roti Manis
        { name: 'Roti Sobek Coklat', sku: 'P-001', categoryId: 'roti-manis', price: 28000, stock: 45, minStock: 10, cost: 15000 },
        { name: 'Roti Keju Spesial', sku: 'P-002', categoryId: 'roti-manis', price: 25000, stock: 38, minStock: 10, cost: 13000 },
        { name: 'Roti Abon', sku: 'P-003', categoryId: 'roti-manis', price: 22000, stock: 42, minStock: 10, cost: 12000 },
        { name: 'Roti Pisang Coklat', sku: 'P-004', categoryId: 'roti-manis', price: 20000, stock: 50, minStock: 15, cost: 10000 },
        { name: 'Roti Kelapa', sku: 'P-005', categoryId: 'roti-manis', price: 18000, stock: 35, minStock: 10, cost: 9000 },
        
        // Roti Tawar
        { name: 'Roti Tawar Jumbo', sku: 'P-006', categoryId: 'roti-tawar', price: 16000, stock: 55, minStock: 15, cost: 8000 },
        { name: 'Roti Tawar Gandum', sku: 'P-007', categoryId: 'roti-tawar', price: 20000, stock: 40, minStock: 12, cost: 11000 },
        { name: 'Roti Tawar Sandwich', sku: 'P-008', categoryId: 'roti-tawar', price: 18000, stock: 48, minStock: 12, cost: 9500 },
        
        // Kue
        { name: 'Brownies Coklat', sku: 'P-009', categoryId: 'kue', price: 35000, stock: 25, minStock: 8, cost: 18000 },
        { name: 'Bolu Kukus Pandan', sku: 'P-010', categoryId: 'kue', price: 30000, stock: 30, minStock: 10, cost: 15000 },
        { name: 'Lapis Legit Mini', sku: 'P-011', categoryId: 'kue', price: 45000, stock: 20, minStock: 5, cost: 25000 },
        { name: 'Cheese Cake Slice', sku: 'P-012', categoryId: 'kue', price: 38000, stock: 18, minStock: 5, cost: 20000 },
        
        // Pastry
        { name: 'Croissant Original', sku: 'P-013', categoryId: 'pastry', price: 22000, stock: 32, minStock: 10, cost: 12000 },
        { name: 'Croissant Almond', sku: 'P-014', categoryId: 'pastry', price: 28000, stock: 28, minStock: 8, cost: 15000 },
        { name: 'Danish Blueberry', sku: 'P-015', categoryId: 'pastry', price: 25000, stock: 24, minStock: 8, cost: 13000 },
        
        // Donat
        { name: 'Donat Coklat', sku: 'P-016', categoryId: 'donat', price: 8000, stock: 60, minStock: 20, cost: 4000 },
        { name: 'Donat Strawberry', sku: 'P-017', categoryId: 'donat', price: 8000, stock: 55, minStock: 20, cost: 4000 },
        { name: 'Donat Green Tea', sku: 'P-018', categoryId: 'donat', price: 10000, stock: 45, minStock: 15, cost: 5000 },
        { name: 'Donat Oreo', sku: 'P-019', categoryId: 'donat', price: 12000, stock: 40, minStock: 15, cost: 6000 },
        
        // Minuman
        { name: 'Kopi Susu Gelas', sku: 'P-020', categoryId: 'minuman', price: 15000, stock: 100, minStock: 30, cost: 6000 },
        { name: 'Teh Tarik', sku: 'P-021', categoryId: 'minuman', price: 12000, stock: 100, minStock: 30, cost: 5000 },
        { name: 'Chocolate Drink', sku: 'P-022', categoryId: 'minuman', price: 18000, stock: 80, minStock: 25, cost: 8000 },
    ]

    const createdProducts = []
    for (const prod of products) {
        const product = await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {
                ...prod, 
                price: prod.price,
                stock: prod.stock,
                minStock: prod.minStock,
                cost: prod.cost,
                description: `${prod.name} - Fresh baked daily!`,
                isActive: true,
            },
            create: { 
                ...prod, 
                price: prod.price,
                stock: prod.stock,
                minStock: prod.minStock,
                cost: prod.cost,
                description: `${prod.name} - Fresh baked daily!`,
                isActive: true,
            },
        })
        createdProducts.push(product)
    }
    console.log('✅ Products seeded!')

    // 7. CUSTOMERS
    console.log('👥 Seeding customers...')
    const customers = [
        { id: 'cust-001', name: 'Budi Santoso', phone: '081234000001', email: 'budi@email.com', address: 'Jl. Melati No. 10' },
        { id: 'cust-002', name: 'Ani Wijaya', phone: '081234000002', email: 'ani@email.com', address: 'Jl. Anggrek No. 15' },
        { id: 'cust-003', name: 'Tono Setiawan', phone: '081234000003', email: 'tono@email.com', address: 'Jl. Dahlia No. 20' },
        { id: 'cust-004', name: 'Rina Kusuma', phone: '081234000004', email: 'rina@email.com', address: 'Jl. Mawar No. 25' },
        { id: 'cust-005', name: 'Joko Prabowo', phone: '081234000005', email: 'joko@email.com', address: 'Jl. Flamboyan No. 30' },
        { id: 'cust-006', name: 'Sari Indah', phone: '081234000006', email: 'sari@email.com', address: 'Jl. Kenanga No. 35' },
        { id: 'cust-007', name: 'Doni Saputra', phone: '081234000007', email: 'doni@email.com', address: 'Jl. Tulip No. 40' },
        { id: 'cust-008', name: 'Maya Lestari', phone: '081234000008', email: 'maya@email.com', address: 'Jl. Sakura No. 45' },
    ]

    const createdCustomers = []
    for (const cust of customers) {
        const customer = await prisma.customer.upsert({
            where: { id: cust.id },
            update: cust,
            create: cust,
        })
        createdCustomers.push(customer)
    }
    console.log('✅ Customers seeded!')

    // 8. TRANSACTIONS (Last 30 days)
    console.log('💰 Seeding transactions...')
    const paymentMethods = ['CASH', 'TRANSFER', 'QRIS', 'DEBIT_CARD', 'EWALLET']
    const users = [owner, manager, kasir1, kasir2]

    for (let i = 0; i < 150; i++) {
        const transDate = randomPastDate(30)
        const customer = createdCustomers[randomInt(0, createdCustomers.length - 1)]
        const cashier = users[randomInt(0, users.length - 1)]
        const paymentMethod = paymentMethods[randomInt(0, paymentMethods.length - 1)]
        
        // Random 2-5 items per transaction
        const itemCount = randomInt(2, 5)
        const transactionItems = []
        let subtotal = 0
        
        for (let j = 0; j < itemCount; j++) {
            const product = createdProducts[randomInt(0, createdProducts.length - 1)]
            const quantity = randomInt(1, 3)
            const price = product.price
            
            transactionItems.push({
                productId: product.id,
                productName: product.name,
                quantity,
                price,
                discount: 0,
                subtotal: price * quantity,
            })
            
            subtotal += price * quantity
        }
        
        const tax = 0 // taxIncluded = false in settings
        const total = subtotal + tax
        
        // Generate transaction number
        const dateStr = transDate.toISOString().split('T')[0].replace(/-/g, '')
        const transNo = `TRX-${dateStr}-${String(i + 1).padStart(4, '0')}`
        
        await prisma.transaction.create({
            data: {
                transactionNo: transNo,
                userId: cashier.id,
                customerId: customer.id,
                subtotal,
                tax,
                discount: 0,
                total,
                paymentMethod,
                paymentAmount: paymentMethod === 'CASH' ? total + randomInt(0, 50000) : total,
                changeAmount: paymentMethod === 'CASH' ? randomInt(0, 50000) : 0,
                status: 'COMPLETED',
                createdAt: transDate,
                items: {
                    create: transactionItems,
                },
            },
        }).catch(() => {
            // Skip if transaction already exists (duplicate transactionNo)
        })
    }
    console.log('✅ Transactions seeded!')

    // 9. DISCOUNTS
    console.log('🏷️  Seeding discounts...')
    await prisma.discount.upsert({
        where: { code: 'OPENING20' },
        update: {},
        create: {
            name: 'Diskon Pembukaan',
            code: 'OPENING20',
            type: 'PERCENTAGE',
            value: 20,
            minPurchase: 50000,
            maxDiscount: 25000,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-03-31'),
            isActive: true,
        },
    })

    await prisma.discount.upsert({
        where: { code: 'WEEKEND15' },
        update: {},
        create: {
            name: 'Diskon Roti Akhir Pekan',
            code: 'WEEKEND15',
            type: 'PERCENTAGE',
            value: 15,
            minPurchase: 30000,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-12-31'),
            isActive: true,
        },
    })

    await prisma.discount.upsert({
        where: { code: 'CASHBACK10K' },
        update: {},
        create: {
            name: 'Cashback 10rb',
            code: 'CASHBACK10K',
            type: 'FIXED',
            value: 10000,
            minPurchase: 100000,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-06-30'),
            isActive: true,
        },
    })
    console.log('✅ Discounts seeded!')

    // 10. EXPENSES
    console.log('💸 Seeding expenses...')
    const expenseCategories = ['SALARY', 'UTILITIES', 'RAW_MATERIALS', 'RENT', 'MARKETING', 'MAINTENANCE']
    const expensePaymentMethods = ['CASH', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD']
    
    for (let i = 0; i < 40; i++) {
        const expenseDate = randomPastDate(30)
        const category = expenseCategories[randomInt(0, expenseCategories.length - 1)]
        const paymentMethod = expensePaymentMethods[randomInt(0, expensePaymentMethods.length - 1)]
        
        let amount, description
        switch (category) {
            case 'SALARY':
                amount = randomInt(4000000, 6000000)
                description = 'Gaji karyawan bulanan'
                break
            case 'UTILITIES':
                amount = randomInt(500000, 1500000)
                description = 'Listrik, air, gas'
                break
            case 'RAW_MATERIALS':
                amount = randomInt(2000000, 5000000)
                description = 'Pembelian bahan baku'
                break
            case 'RENT':
                amount = randomInt(5000000, 8000000)
                description = 'Sewa toko bulanan'
                break
            case 'MARKETING':
                amount = randomInt(300000, 1000000)
                description = 'Iklan social media'
                break
            case 'MAINTENANCE':
                amount = randomInt(200000, 800000)
                description = 'Perbaikan dan perawatan'
                break
        }
        
        await prisma.expense.create({
            data: {
                amount,
                category,
                description,
                date: expenseDate,
                paymentMethod,
                userId: users[randomInt(0, 1)].id, // Owner or Manager
            },
        })
    }
    console.log('✅ Expenses seeded!')

    console.log('🎉 Database seeding completed successfully!')
    console.log(`
    📊 Summary:
    - Users: ${users.length}
    - Categories: ${categories.length}
    - Products: ${createdProducts.length}
    - Customers: ${createdCustomers.length}
    - Suppliers: ${createdSuppliers.length}
    - Transactions: 150
    - Discounts: 3
    - Expenses: 40
    
    🔑 Login credentials:
    - Owner: owner@tokoroti.com / admin123
    - Manager: manager@tokoroti.com / admin123
    - Kasir 1: kasir1@tokoroti.com / admin123
    - Kasir 2: kasir2@tokoroti.com / admin123
    `)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
