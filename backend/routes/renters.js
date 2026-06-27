const express = require('express');
const router = express.Router();
const Renter = require('../models/Renter');
const authMiddleware = require('../middleware/auth');

// Public route: Get all renters (for dashboard)
router.get('/', async (req, res) => {
  try {
    const renters = await Renter.find().sort({ createdAt: -1 });
    res.json(renters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching renters data', error: error.message });
  }
});

// Admin-only route: Add new renter
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, contactNumber, baseRent, electricityRate, initialMeterReading } = req.body;

    if (!name || !contactNumber || baseRent === undefined || electricityRate === undefined || initialMeterReading === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newRenter = new Renter({
      name,
      contactNumber,
      baseRent: Number(baseRent),
      electricityRate: Number(electricityRate),
      initialMeterReading: Number(initialMeterReading),
      bills: []
    });

    const savedRenter = await newRenter.save();
    res.status(201).json(savedRenter);
  } catch (error) {
    res.status(400).json({ message: 'Error creating renter', error: error.message });
  }
});

// Admin-only route: Edit renter basic details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, contactNumber, baseRent, electricityRate, initialMeterReading } = req.body;

    const renter = await Renter.findById(req.params.id);
    if (!renter) {
      return res.status(404).json({ message: 'Renter not found' });
    }

    if (name) renter.name = name;
    if (contactNumber) renter.contactNumber = contactNumber;
    if (baseRent !== undefined) renter.baseRent = Number(baseRent);
    if (electricityRate !== undefined) renter.electricityRate = Number(electricityRate);
    if (initialMeterReading !== undefined) renter.initialMeterReading = Number(initialMeterReading);

    const updatedRenter = await renter.save();
    res.json(updatedRenter);
  } catch (error) {
    res.status(400).json({ message: 'Error updating renter', error: error.message });
  }
});

// Admin-only route: Add or Update a monthly bill & payment
router.post('/:id/bills', authMiddleware, async (req, res) => {
  try {
    const { month, lastReading, currentReading, rentDue, amountPaid, paymentDate } = req.body;

    if (!month || lastReading === undefined || currentReading === undefined || rentDue === undefined) {
      return res.status(400).json({ message: 'Month, last reading, current reading, and rent due are required' });
    }

    const last = Number(lastReading);
    const current = Number(currentReading);
    const rent = Number(rentDue);
    const paid = Number(amountPaid || 0);

    if (current < last) {
      return res.status(400).json({ message: 'Current reading cannot be less than last reading' });
    }

    const renter = await Renter.findById(req.params.id);
    if (!renter) {
      return res.status(404).json({ message: 'Renter not found' });
    }

    const electricityBillDue = (current - last) * renter.electricityRate;
    const totalDue = rent + electricityBillDue;
    const balance = totalDue - paid;

    const existingBillIndex = renter.bills.findIndex(b => b.month === month);

    const billData = {
      month,
      lastReading: last,
      currentReading: current,
      electricityBillDue,
      rentDue: rent,
      amountPaid: paid,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      totalDue,
      balance
    };

    if (existingBillIndex > -1) {
      renter.bills[existingBillIndex] = billData;
    } else {
      renter.bills.push(billData);
    }

    const updatedRenter = await renter.save();
    res.json(updatedRenter);
  } catch (error) {
    res.status(400).json({ message: 'Error adding/updating bill', error: error.message });
  }
});

// Admin-only route: Delete a renter
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const renter = await Renter.findByIdAndDelete(req.params.id);
    if (!renter) {
      return res.status(404).json({ message: 'Renter not found' });
    }
    res.json({ message: 'Renter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting renter', error: error.message });
  }
});

module.exports = router;
