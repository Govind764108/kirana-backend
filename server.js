const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
// Make sure your .env file has MONGODB_URI=your_connection_string
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log(err));

// --- SCHEMAS ---
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: String,
    city: String,
    mobile: String,
    createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    type: { type: String, enum: ['GAVE_GOODS', 'GOT_PAYMENT'], required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', CustomerSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- ROUTES ---

// 1. LOGIN (Simple PIN protection)
app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    // HARDCODED PIN: 1234 (You can change this)
    if (pin === "1234") {
        res.json({ success: true, message: "Login Successful" });
    } else {
        res.status(401).json({ success: false, message: "Wrong PIN" });
    }
});

// 2. GET ALL CUSTOMERS (With Calculated Totals)
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        const customersWithBalance = await Promise.all(customers.map(async (c) => {
            const txns = await Transaction.find({ customerId: c._id });
            const totalBalance = txns.reduce((acc, t) => {
                // If we GAVE goods, balance increases (Positive)
                // If we GOT payment, balance decreases (Negative)
                return t.type === 'GAVE_GOODS' ? acc + t.amount : acc - t.amount;
            }, 0);
            return { ...c._doc, totalBalance };
        }));
        res.json(customersWithBalance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. CREATE NEW CUSTOMER
app.post('/api/customers', async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        await newCustomer.save();
        res.json(newCustomer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. [NEW] EDIT CUSTOMER
app.put('/api/customers/:id', async (req, res) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // Return the updated document
        );
        res.json(updatedCustomer);
    } catch (err) {
        res.status(500).json({ error: "Failed to update customer" });
    }
});

// 5. [NEW] DELETE CUSTOMER (And their transactions)
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // Step 1: Delete all transactions for this customer
        await Transaction.deleteMany({ customerId: customerId });
        
        // Step 2: Delete the customer profile itself
        await Customer.findByIdAndDelete(customerId);
        
        res.json({ success: true, message: "Customer and all data deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete customer" });
    }
});

// 6. GET TRANSACTIONS FOR A CUSTOMER
app.get('/api/transactions/:id', async (req, res) => {
    try {
        const transactions = await Transaction.find({ customerId: req.params.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. ADD NEW TRANSACTION
app.post('/api/transaction', async (req, res) => {
    try {
        const newTxn = new Transaction(req.body);
        await newTxn.save();
        res.json(newTxn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. DELETE TRANSACTION
app.delete('/api/transaction/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));