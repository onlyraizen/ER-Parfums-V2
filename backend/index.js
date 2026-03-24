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
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
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

// --- HELPER: SIMULATE SMS IN TERMINAL ---
const simulateSMS = (toPhone, messageBody) => {
    const formattedPhone = toPhone.startsWith('0') ? '+63' + toPhone.slice(1) : toPhone;
    console.log(`\n📱 --- SIMULATED SMS ALERT --- 📱`);
    console.log(`To: ${formattedPhone}`);
    console.log(`Message: ${messageBody}`);
    console.log(`-------------------------------\n`);
};

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

// --- PHONE VERIFICATION LOGIC ---
app.post('/api/users/send-phone-otp', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.body;
        const existing = await prisma.user.findFirst({ where: { phone, isPhoneVerified: true } });
        if(existing && existing.id !== req.user.userId) return res.status(400).json({ status: 'error', message: 'Phone number verified to another account.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        securityOtps.set(`phone_verify_pending_${req.user.userId}`, { otp, phone, expires: Date.now() + 10 * 60000 });
        simulateSMS(phone, `Your ER Parfums verification code is ${otp}`);

        res.json({ status: 'success', message: 'SMS OTP Sent.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/confirm-phone', authenticateToken, async (req, res) => {
    try {
        const { otp } = req.body;
        const record = securityOtps.get(`phone_verify_pending_${req.user.userId}`);
        if (!record || record.otp !== otp || record.expires < Date.now()) return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP.' });

        await prisma.user.update({ where: { id: req.user.userId }, data: { phone: record.phone, isPhoneVerified: true } });
        securityOtps.delete(`phone_verify_pending_${req.user.userId}`);
        res.json({ status: 'success', message: 'Phone successfully saved & verified.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- COMPLEX EMAIL CHANGE LOGIC ---
app.post('/api/users/change-email/step1-sms', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user.isPhoneVerified) return res.status(400).json({ status: 'error', message: 'Phone must be verified first.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        securityOtps.set(`email_change_sms_${req.user.userId}`, { otp, expires: Date.now() + 10 * 60000 });
        simulateSMS(user.phone, `ER Parfums Security Code to change your email is: ${otp}`);

        res.json({ status: 'success', message: 'Security SMS sent to registered phone.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/change-email/step2-email', authenticateToken, async (req, res) => {
    try {
        const { smsOtp } = req.body;
        const record = securityOtps.get(`email_change_sms_${req.user.userId}`);
        if (!record || record.otp !== smsOtp || record.expires < Date.now()) return res.status(400).json({ status: 'error', message: 'Invalid SMS OTP.' });
        
        securityOtps.delete(`email_change_sms_${req.user.userId}`); 
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        securityOtps.set(`email_change_email_${req.user.userId}`, { otp: emailOtp, expires: Date.now() + 10 * 60000 });

        await transporter.sendMail({
            from: `"ER Parfums" <${process.env.EMAIL_USER}>`, to: user.email, subject: 'ER Parfums - Change Email Request',
            html: `<div style="text-align: center; padding: 20px;"><h2>ER PARFUMS</h2><p>Your code to authorize an email change is:</p><h1 style="letter-spacing: 5px;">${emailOtp}</h1></div>`
        });
        res.json({ status: 'success', message: 'Verification email sent.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/change-email/step3-verify-new-email', authenticateToken, async (req, res) => {
    try {
        const { emailOtp, newEmail } = req.body;
        const record = securityOtps.get(`email_change_email_${req.user.userId}`);
        if (!record || record.otp !== emailOtp || record.expires < Date.now()) return res.status(400).json({ status: 'error', message: 'Invalid OTP for current email.' });

        securityOtps.delete(`email_change_email_${req.user.userId}`); 
        const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingUser) return res.status(400).json({ status: 'error', message: 'This new email is already in use.' });

        const finalOtp = Math.floor(100000 + Math.random() * 900000).toString();
        securityOtps.set(`email_change_final_${req.user.userId}`, { otp: finalOtp, pendingEmail: newEmail, expires: Date.now() + 10 * 60000 });

        await transporter.sendMail({
            from: `"ER Parfums" <${process.env.EMAIL_USER}>`, to: newEmail, subject: 'ER Parfums - Verify Your New Email',
            html: `<div style="text-align: center; padding: 20px;"><h2>ER PARFUMS</h2><p>Your verification code for this new email address is:</p><h1 style="letter-spacing: 5px;">${finalOtp}</h1></div>`
        });
        res.json({ status: 'success', message: 'Verification email sent to new address.' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.post('/api/users/change-email/step4-finalize', authenticateToken, async (req, res) => {
    try {
        const { finalOtp } = req.body;
        const record = securityOtps.get(`email_change_final_${req.user.userId}`);
        if (!record || record.otp !== finalOtp || record.expires < Date.now()) return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP for new email.' });

        const newEmail = record.pendingEmail;
        const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
        if (existingUser) return res.status(400).json({ status: 'error', message: 'This new email was just taken. Change failed.' });

        await prisma.user.update({ where: { id: req.user.userId }, data: { email: newEmail } });
        securityOtps.delete(`email_change_final_${req.user.userId}`);
        res.json({ status: 'success', message: 'Email successfully changed!' });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// --- STANDARD ROUTES ---
app.post('/api/products', async (req, res) => {
    try {
        const { name, category, description, price, price30ml, price3ml, stock } = req.body;
        const newProduct = await prisma.product.create({ data: { name, category, description, price, price30ml, price3ml, stock } });
        res.status(201).json({ status: 'success', data: newProduct });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
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
        const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!product) return res.status(404).json({ message: 'Fragrance not found' });
        res.json({ status: 'success', data: product });
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
        await transporter.sendMail({ from: `"ER Parfums" <${process.env.EMAIL_USER}>`, to: email, subject: 'ER Parfums - Registration OTP', html: `<div style="text-align: center; padding: 20px;"><h2>ER PARFUMS</h2><p>Your one-time registration code is:</p><h1 style="letter-spacing: 5px;">${otp}</h1></div>` });
        res.json({ status: 'success', message: 'Registration OTP sent.' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed to send email.' }); }
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

app.post('/api/login', async (req, res) => {
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

// --- NEW: PAYMONGO GCASH CHECKOUT ROUTE ---
app.post('/api/checkout/paymongo', authenticateToken, async (req, res) => {
    try {
        const { total_amount, user, items, recaptchaToken, shippingAddressId, manualAddress } = req.body;
        const userId = req.user.userId;

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });

        const amountInCentavos = Math.round(total_amount * 100);

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
                        description: `ER Parfums - Web Order`,
                        remarks: `Customer: ${user?.fullname}`
                    }
                }
            }
        };

        const paymongoResponse = await axios.request(options);
        const checkoutUrl = paymongoResponse.data.data.attributes.checkout_url;

        // Build the shipping address safely to satisfy Prisma
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

        const order_number = 'PM-' + Math.floor(10000000 + Math.random() * 90000000); 
        
        await prisma.order.create({ 
            data: { 
                order_number, 
                user: { connect: { id: userId } }, 
                shippingAddress: shippingAddressPayload, // <-- THE FIX
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
        const { total_amount, paymentMethod, payment_method, items, recaptchaToken, shippingAddressId, manualAddress } = req.body;
        const method = paymentMethod || payment_method || 'COD';
        
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(400).json({ status: 'error', message: 'Please complete the reCAPTCHA.' });
        
        const userId = req.user.userId; 
        
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
                shippingAddress: shippingAddressPayload, // <-- THE FIX
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

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({ include: { user: true, items: { include: { product: true } } }, orderBy: { createdAt: 'desc' } });
        res.json({ status: 'success', data: orders });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body; 
        const updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: status } });
        res.json({ status: 'success', data: updatedOrder });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ status: 'error', message: 'Unauthorized Access' });
        const productId = parseInt(req.params.id);
        await prisma.product.delete({ where: { id: productId } });
        res.json({ status: 'success', message: 'Product successfully removed.' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Could not delete product.' }); }
});

app.get('/api/analytics/predict', authenticateToken, async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        const orders = await prisma.order.findMany({ include: { items: true } });
        const analytics = products.map(product => {
            let totalSold = 0;
            orders.forEach(order => { order.items.forEach(item => { if (item.productId === product.id) totalSold += item.quantity; }); });
            const averageDailySales = totalSold > 0 ? (totalSold / 30) : 0;
            let predictedDaysLeft = "Safe", status = "Healthy", statusColor = "#4CAF50"; 
            if (averageDailySales > 0) {
                const daysLeft = Math.floor(product.stock / averageDailySales);
                predictedDaysLeft = `${daysLeft} days`;
                if (daysLeft <= 14) { status = "Restock Immediately"; statusColor = "#ff4d4d"; } 
                else if (daysLeft <= 30) { status = "Monitor Stock"; statusColor = "#fdd835"; }
            } else if (product.stock === 0) { predictedDaysLeft = "0 days"; status = "Out of Stock"; statusColor = "#ff4d4d"; } 
            else if (totalSold === 0) { predictedDaysLeft = "Insufficient Data"; status = "New Product / No Sales"; statusColor = "#888"; }
            return { id: product.id, name: product.name, currentStock: product.stock, totalSold, dailyVelocity: averageDailySales.toFixed(2), predictedDaysLeft, status, statusColor };
        });
        res.json({ status: 'success', data: analytics });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));