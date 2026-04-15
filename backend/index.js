const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(helmet()); 
app.use(cors({
    origin: 'https://er-parfums-v2.vercel.app', 
    credentials: true
}));
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) { 
        cb(null, 'uploads/') 
    },
    filename: function (req, file, cb) { 
        cb(null, 'user-' + req.user.userId + '-' + Date.now() + path.extname(file.originalname)) 
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG formats are allowed.'));
        }
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'er_parfums_super_secret_key_2026';

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

const registrationOtps = new Map();
const securityOtps = new Map();

const verifyRecaptcha = async (token) => {
    if (!token) return false;
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, { method: 'POST' });
        const data = await response.json(); 
        return data.success;
    } catch (error) { return false; }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) return res.status(401).json({ status: 'error', message: 'Access denied.' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ status: 'error', message: 'Invalid token.' });
        req.user = user; 
        next(); 
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ status: 'error', message: 'Forbidden. Admin privileges required.' });
    }
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: { status: 'error', message: 'Too many login attempts. Please try again in 15 minutes.' }
});

app.get('/', (req, res) => res.send('ER Parfums V2 Backend is running!'));

// --- PROFILE & AVATAR ROUTES ---
app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({ status: 'success', data: user });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/avatar', authenticateToken, (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) return res.status(400).json({ status: 'error', message: err.message });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
        const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await prisma.user.update({ where: { id: req.user.userId }, data: { avatar: avatarUrl } });
        res.json({ status: 'success', avatarUrl });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { username, fullname, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        let dataToUpdate = { fullname };

        if (username && username !== user.username) {
            if (user.isUsernameSet) return res.status(400).json({ status: 'error', message: 'Username is permanently locked.' });
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) return res.status(400).json({ status: 'error', message: 'Username is already taken.' });
            dataToUpdate.username = username;
            dataToUpdate.isUsernameSet = true;
        }
        if (newPassword && newPassword.trim() !== '') dataToUpdate.password = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({ where: { id: req.user.userId }, data: dataToUpdate });
        res.json({ status: 'success', user: updatedUser });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- ADDRESS PERSISTENCE ROUTES ---
app.get('/api/users/addresses', authenticateToken, async (req, res) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user.userId },
            orderBy: { isDefault: 'desc' }
        });
        res.json({ status: 'success', data: addresses });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/addresses', authenticateToken, async (req, res) => {
    try {
        const { street, barangay, city, province, region, zip, isDefault } = req.body;
        
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: req.user.userId, isDefault: true },
                data: { isDefault: false }
            });
        }
        
        const newAddress = await prisma.address.create({
            data: { userId: req.user.userId, street, barangay, city, province, region, zip, isDefault }
        });
        
        res.status(201).json({ status: 'success', data: newAddress });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.delete('/api/users/addresses/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.address.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ status: 'success', message: 'Address removed.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- ADMIN PRODUCT ROUTES (UPDATED FOR MULTIPLE IMAGES & DETAILS) ---
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, description, details, price, price30ml, price3ml, stock100ml, stock30ml, stock3ml, images, cover_image_url, topNotes, heartNotes, baseNotes, scentFamily } = req.body;
        const newProduct = await prisma.product.create({ 
            data: { name, category, description, details, price, price30ml, price3ml, stock100ml, stock30ml, stock3ml, images, cover_image_url, topNotes, heartNotes, baseNotes, scentFamily } 
        });
        res.status(201).json({ status: 'success', data: newProduct });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, description, details, price, price30ml, price3ml, stock100ml, stock30ml, stock3ml, images, cover_image_url, topNotes, heartNotes, baseNotes, scentFamily } = req.body;
        const updatedProduct = await prisma.product.update({ 
            where: { id: parseInt(req.params.id) },
            data: { name, category, description, details, price, price30ml, price3ml, stock100ml, stock30ml, stock3ml, images, cover_image_url, topNotes, heartNotes, baseNotes, scentFamily } 
        });
        res.json({ status: 'success', data: updatedProduct });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        await prisma.product.delete({ where: { id: productId } });
        res.json({ status: 'success', message: 'Product successfully removed.' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Could not delete product.' }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let whereClause = {};
        if (category && category !== 'All' && category !== 'Highlights') whereClause.category = { equals: String(category).trim(), mode: 'insensitive' };
        if (search) whereClause.OR = [ { name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } } ];
        const products = await prisma.product.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
        res.json({ status: 'success', data: products });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ 
            where: { id: parseInt(req.params.id) },
            include: {
                reviews: {
                    include: { user: { select: { fullname: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!product) return res.status(404).json({ message: 'Fragrance not found' });
        res.json({ status: 'success', data: product });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- NEW: CHECK IF USER HAS PURCHASED BEFORE REVIEWING ---
app.get('/api/orders/check-purchase/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const productId = parseInt(req.params.productId);

        const completedOrder = await prisma.order.findFirst({
            where: {
                userId: userId,
                status: 'Completed',
                items: {
                    some: {
                        productId: productId
                    }
                }
            }
        });

        res.status(200).json({ hasPurchased: !!completedOrder });
    } catch (error) {
        console.error("Error checking purchase status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const userId = req.user.userId;
        const { rating, comment } = req.body;

        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: userId,
                status: 'Completed', 
                items: { some: { productId: productId } }
            }
        });

        if (!hasPurchased) {
            return res.status(403).json({ status: 'error', message: 'You can only leave a review after your order is marked as COMPLETED.' });
        }

        const existingReview = await prisma.review.findFirst({
            where: { userId: userId, productId: productId }
        });

        if (existingReview) {
            return res.status(400).json({ status: 'error', message: 'You have already reviewed this fragrance.' });
        }

        const newReview = await prisma.review.create({
            data: { rating: parseInt(rating), comment, userId, productId }
        });

        res.status(201).json({ status: 'success', data: newReview });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/send-register-otp', async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body;
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ status: 'error', message: 'This email is already registered.' });
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        registrationOtps.set(email, { otp, expires: Date.now() + 10 * 60000 });
        
        await transporter.sendMail({ 
            from: `"ER Parfums" <${process.env.EMAIL_USER}>`, 
            to: email, 
            subject: 'ER Parfums - Registration OTP', 
            html: `<div style="text-align: center; padding: 20px;"><h2>ER PARFUMS</h2><p>Your one-time registration code is:</p><h1 style="letter-spacing: 5px;">${otp}</h1></div>` 
        });
        res.json({ status: 'success', message: 'Registration OTP sent.' });
    } catch (error) { 
        // 👇 THIS IS THE CRITICAL ADDITION 👇
        console.error("🔥 CRITICAL OTP ERROR:", error); 
        res.status(500).json({ status: 'error', message: 'Failed to send email.' }); 
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { fullname, email, password, otp } = req.body;
        const record = registrationOtps.get(email);
        if (!record || record.otp !== otp || record.expires < Date.now()) return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({ data: { fullname, email, password: hashedPassword } });
        registrationOtps.delete(email);
        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ status: 'success', message: 'Registered successfully', token, user: { id: newUser.id, fullname: newUser.fullname, role: newUser.role } });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, recaptchaToken } = req.body;
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ status: 'success', message: 'Login successful', token, user: { id: user.id, fullname: user.fullname, role: user.role } });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body;
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'If this email exists, an OTP was sent.' });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.user.update({ where: { email }, data: { resetOtp: otp, resetOtpExpiry: new Date(Date.now() + 10 * 60000) } });
        await transporter.sendMail({ from: `"ER Parfums" <${process.env.EMAIL_USER}>`, to: email, subject: 'ER Parfums - Password Reset', html: `<div style="text-align: center; padding: 20px;"><h2>ER PARFUMS</h2><p>Your password reset code is:</p><h1 style="letter-spacing: 5px;">${otp}</h1></div>` });
        res.json({ status: 'success', message: 'OTP sent to your email.' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed to send email.' }); }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.resetOtp !== otp || user.resetOtpExpiry < new Date()) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { email }, data: { password: hashedPassword, resetOtp: null, resetOtpExpiry: null } });
        res.json({ status: 'success', message: 'Password has been successfully reset.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- PAYMONGO GCASH CHECKOUT ROUTE ---
app.post('/api/checkout/paymongo', authenticateToken, async (req, res) => {
    try {
        const { total_amount, user, items, recaptchaToken, shippingAddressId, manualAddress } = req.body;
        const userId = req.user.userId;

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });

        if (user && user.phone) {
            await prisma.user.update({ where: { id: userId }, data: { phone: user.phone } });
        }

        const amountInCentavos = Math.round(total_amount * 100);
        const order_number = 'PM-' + Math.floor(10000000 + Math.random() * 90000000); 

        const options = {
            method: 'POST',
            url: 'https://api.paymongo.com/v1/links',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            data: {
                data: {
                    attributes: {
                        amount: amountInCentavos,
                        description: `Order ${order_number}`,
                        remarks: order_number 
                    }
                }
            }
        };

        const paymongoResponse = await axios.request(options);
        const checkoutUrl = paymongoResponse.data.data.attributes.checkout_url;

        let shippingAddressPayload;
        if (shippingAddressId) {
            shippingAddressPayload = { connect: { id: parseInt(shippingAddressId, 10) } };
        } else {
            shippingAddressPayload = {
                create: {
                    userId: userId,
                    region: manualAddress?.region || 'N/A',
                    province: manualAddress?.province || 'N/A',
                    city: manualAddress?.city || 'N/A',
                    barangay: manualAddress?.barangay || 'N/A',
                    street: manualAddress?.street || 'N/A',
                    zip: manualAddress?.zip || 'N/A'
                }
            };
        }

        await prisma.order.create({ 
            data: { 
                order_number, 
                user: { connect: { id: userId } }, 
                shippingAddress: shippingAddressPayload, 
                total_amount, 
                payment_method: 'GCash',
                status: 'Pending', 
                items: { 
                    create: items.map(item => ({ 
                        productId: parseInt(item.id || item.productId, 10), 
                        quantity: item.quantity, 
                        price: item.price 
                    })) 
                } 
            } 
        });

        res.status(200).json({ checkoutUrl });

    } catch (error) {
        console.error('PayMongo Integration Error:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Failed to generate PayMongo checkout link.' });
    }
});

// --- STANDARD COD CHECKOUT ROUTE ---
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { total_amount, paymentMethod, payment_method, items, recaptchaToken, shippingAddressId, manualAddress, user } = req.body;
        const method = paymentMethod || payment_method || 'COD';
        
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });
        
        const userId = req.user.userId; 

        if (user && user.phone) {
            await prisma.user.update({ where: { id: userId }, data: { phone: user.phone } });
        }
        
        let shippingAddressPayload;
        if (shippingAddressId) {
            shippingAddressPayload = { connect: { id: parseInt(shippingAddressId, 10) } };
        } else {
            shippingAddressPayload = {
                create: {
                    userId: userId,
                    region: manualAddress?.region || 'N/A',
                    province: manualAddress?.province || 'N/A',
                    city: manualAddress?.city || 'N/A',
                    barangay: manualAddress?.barangay || 'N/A',
                    street: manualAddress?.street || 'N/A',
                    zip: manualAddress?.zip || 'N/A'
                }
            };
        }

        const order_number = 'ORD-' + Math.floor(10000000 + Math.random() * 90000000);
        
        const newOrder = await prisma.order.create({ 
            data: { 
                order_number, 
                user: { connect: { id: userId } }, 
                shippingAddress: shippingAddressPayload, 
                total_amount, 
                payment_method: method, 
                items: { 
                    create: items.map(item => ({ 
                        productId: parseInt(item.productId || item.id, 10), 
                        quantity: item.quantity, 
                        price: item.price 
                    })) 
                } 
            }, 
            include: { items: true } 
        });
        
        res.status(201).json({ status: 'success', data: newOrder });
    } catch (error) { 
        console.error('Prisma Error:', error);
        res.status(500).json({ status: 'error', message: error.message }); 
    }
});

app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({ where: { userId: req.user.userId }, include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
        res.json({ status: 'success', data: orders });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.get('/api/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({ include: { user: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
        res.json({ status: 'success', data: orders });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body; 
        const updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: status } });
        res.json({ status: 'success', data: updatedOrder });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- RETURN REQUEST ROUTE ---
app.post('/api/orders/:orderNumber/return', authenticateToken, async (req, res) => {
    try {
        const { reason, details } = req.body;
        
        const order = await prisma.order.findFirst({
            where: { order_number: req.params.orderNumber, userId: req.user.userId }
        });

        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found.' });
        if (order.status !== 'Completed') return res.status(400).json({ status: 'error', message: 'Only completed orders can be returned.' });

        await prisma.order.update({
            where: { id: order.id },
            data: { status: 'Return/Refund' }
        });

        res.json({ status: 'success', message: 'Return request submitted successfully.' });
    } catch (error) { 
        console.error('Return Error:', error);
        res.status(500).json({ status: 'error', message: error.message }); 
    }
});

app.get('/api/analytics/predict', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentOrders = await prisma.order.findMany({ 
            where: { createdAt: { gte: thirtyDaysAgo } },
            include: { items: true } 
        });

        const analytics = products.map(product => {
            let totalSoldLast30Days = 0;
            recentOrders.forEach(order => { 
                order.items.forEach(item => { 
                    if (item.productId === product.id) totalSoldLast30Days += item.quantity; 
                }); 
            });

            const averageDailySales = totalSoldLast30Days > 0 ? (totalSoldLast30Days / 30) : 0;
            let predictedDaysLeft = "Safe", status = "Healthy", statusColor = "#4CAF50"; 
            
            // Assume predicting off 100ml stock for simplicity in this view
            if (averageDailySales > 0) {
                const daysLeft = Math.floor(product.stock100ml / averageDailySales);
                predictedDaysLeft = `${daysLeft} days`;
                if (daysLeft <= 14) { status = "Restock Immediately"; statusColor = "#ff4d4d"; } 
                else if (daysLeft <= 30) { status = "Monitor Stock"; statusColor = "#fdd835"; }
            } else if (product.stock100ml === 0) { predictedDaysLeft = "0 days"; status = "Out of Stock"; statusColor = "#ff4d4d"; } 
            else if (totalSoldLast30Days === 0) { predictedDaysLeft = "Insufficient Data"; status = "New Product / No Sales"; statusColor = "#888"; }
            
            return { 
                id: product.id, 
                name: product.name, 
                currentStock: product.stock100ml, 
                totalSold: totalSoldLast30Days,
                dailyVelocity: averageDailySales.toFixed(2), 
                predictedDaysLeft, 
                status, 
                statusColor 
            };
        });
        res.json({ status: 'success', data: analytics });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.get('/api/analytics/revenue', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { status: { not: 'Cancelled' } }, 
            select: { total_amount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        const monthlyRevenue = {};
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            
            if (!monthlyRevenue[monthYear]) monthlyRevenue[monthYear] = 0;
            monthlyRevenue[monthYear] += order.total_amount;
        });

        res.json({ status: 'success', data: monthlyRevenue });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- PAYMONGO WEBHOOK (AUTO-UPDATE TO "TO SHIP") ---
app.post('/api/webhooks/paymongo', async (req, res) => {
    try {
        const event = req.body;

        if (event.data && event.data.attributes && event.data.attributes.type === 'link.payment.paid') {
            const paidOrderNumber = event.data.attributes.data.attributes.remarks;

            if (paidOrderNumber) {
                await prisma.order.updateMany({
                    where: { order_number: paidOrderNumber },
                    data: { status: 'Processing' }
                });
                console.log(`✅ SUCCESS: Order ${paidOrderNumber} automatically marked as TO SHIP`);
            }
        }
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Webhook error');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));