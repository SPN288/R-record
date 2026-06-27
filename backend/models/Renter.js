const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "June 2026"
  lastReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  electricityBillDue: { type: Number, required: true }, // (currentReading - lastReading) * electricityRate
  rentDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  paymentDate: { type: Date },
  totalDue: { type: Number, required: true }, // rentDue + electricityBillDue
  balance: { type: Number, required: true } // totalDue - amountPaid
}, { timestamps: true });

const renterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  baseRent: { type: Number, required: true },
  electricityRate: { type: Number, required: true },
  initialMeterReading: { type: Number, required: true },
  bills: [billSchema]
}, { timestamps: true });

module.exports = mongoose.model('Renter', renterSchema);
