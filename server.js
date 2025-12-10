const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Customer, Transaction } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// If this fails, it means MongoDB is not installed on your laptop.
// We will fix that in the next step if you see an error.// Replace 'YOUR_PASSWORD_HERE' with the password you created (e.g., kirana123)
// ↓↓↓ COPY THIS EXACTLY ↓↓↓
const MONGO_URL = "mongodb+srv://govindjoshi_db_user:Kirana123@cluster0.irbjspy.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Database Connected"))
    .catch(err => console.error("❌ Database Error (Is MongoDB running?):", err));

// --- API ROUTES ---

// Get All Customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ lastUpdated: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add New Customer (UPDATED)
app.post('/api/customers', async (req, res) => {
    try {
        // We now accept fatherName and city from the frontend
        const { name, mobile, fatherName, city } = req.body;
        
        if (!name) return res.status(400).json({ error: "Name is required" });

        const newCustomer = new Customer({ 
            name, 
            mobile, 
            fatherName, 
            city 
        });
        
        await newCustomer.save();
        res.json(newCustomer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Transaction
app.post('/api/transaction', async (req, res) => {
    const { customerId, type, amount, description } = req.body;
    try {
        const transaction = new Transaction({ customerId, type, amount, description });
        await transaction.save();

        const customer = await Customer.findById(customerId);
        if (type === 'GAVE_GOODS') customer.totalBalance += Number(amount);
        else customer.totalBalance -= Number(amount);
        
        customer.lastUpdated = new Date();
        await customer.save();

        res.json({ message: "Transaction Saved", newBalance: customer.totalBalance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ... existing code ...

// 4. NEW: Get History for a Specific Customer
app.get('/api/transactions/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        // Find transactions for this ID and sort by Date (Newest first)
        const history = await Transaction.find({ customerId }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ... existing code ...

// 5. NEW: Login (PIN Check)
app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    
    // 🔒 MASTER PASSWORD (You can change '1234' to anything)
    const SECRET_PIN = "1234";

    if (pin === SECRET_PIN) {
        res.json({ success: true, message: "Welcome Owner!" });
    } else {
        res.status(401).json({ success: false, message: "Wrong PIN" });
    }
});

// Use the port Render assigns, OR use 5000 if on laptop
const PORT = process.env.PORT || 5000;
// ... existing code ...

// 6. NEW: Delete Transaction & Fix Balance
app.delete('/api/transaction/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Find the transaction first (so we know how much money to reverse)
        const txn = await Transaction.findById(id);
        if (!txn) return res.status(404).json({ error: "Transaction not found" });

        // 2. Find the Customer
        const customer = await Customer.findById(txn.customerId);

        // 3. Reverse the Math
        // If we originally GAVE GOODS (+), we must now SUBTRACT (-)
        // If we originally GOT PAYMENT (-), we must now ADD (+)
        if (txn.type === 'GAVE_GOODS') {
            customer.totalBalance -= txn.amount; 
        } else {
            customer.totalBalance += txn.amount;
        }

        // 4. Save changes
        await customer.save();
        await Transaction.findByIdAndDelete(id);

        res.json({ message: "Deleted and Balance Updated" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... app.listen is down here ...
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});