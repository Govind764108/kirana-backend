const mongoose = require('mongoose');

// --- CUSTOMER BLUEPRINT (Updated) ---
const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: String,       // Optional
    fatherName: String,   // NEW FIELD
    city: String,         // NEW FIELD
    totalBalance: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

// --- TRANSACTION BLUEPRINT ---
const transactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['GAVE_GOODS', 'GOT_PAYMENT'], required: true },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Customer, Transaction };