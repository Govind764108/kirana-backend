const mongoose = require('mongoose');

// 1. Customer Schema
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    totalBalance: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

// 2. Transaction Schema
const TransactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    type: { type: String, enum: ['GAVE_GOODS', 'GOT_PAYMENT'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', CustomerSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { Customer, Transaction };