import React, { useState, useEffect } from 'react';
import { Calendar, Zap, DollarSign, X, Check, Calculator, Info } from 'lucide-react';

const BillForm = ({ renter, onClose, onBillSaved, backendUrl }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Format current year-month for input (e.g., "2026-06")
  const getCurrentMonthString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  };

  const [monthInput, setMonthInput] = useState(getCurrentMonthString());
  const [lastReading, setLastReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [rentDue, setRentDue] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentDate, setPaymentDate] = useState(today);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existsWarning, setExistsWarning] = useState(false);

  // Helper to convert "2026-06" to "June 2026"
  const formatMonthName = (yearMonthStr) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Determine starting values based on renter history
  useEffect(() => {
    if (renter) {
      // Base Rent
      setRentDue(renter.baseRent);
      
      // Determine last reading:
      // If there are bills, default to the current reading of the last bill.
      // Otherwise, default to initialMeterReading.
      if (renter.bills && renter.bills.length > 0) {
        // Sort by date or just take the last element
        // Let's sort the bills by month to find the latest
        const sortedBills = [...renter.bills].sort((a, b) => (Date.parse(b.month) || 0) - (Date.parse(a.month) || 0));
        setLastReading(sortedBills[0].currentReading);
      } else {
        setLastReading(renter.initialMeterReading);
      }
    }
  }, [renter]);

  // Check if bill already exists for the selected month
  useEffect(() => {
    if (renter && monthInput) {
      const monthFormatted = formatMonthName(monthInput);
      const exists = renter.bills && renter.bills.some(b => b.month === monthFormatted);
      setExistsWarning(exists);
      
      // If the bill exists, let's load its values so the admin can edit them!
      if (exists) {
        const existingBill = renter.bills.find(b => b.month === monthFormatted);
        setLastReading(existingBill.lastReading);
        setCurrentReading(existingBill.currentReading);
        setRentDue(existingBill.rentDue);
        setAmountPaid(existingBill.amountPaid);
        if (existingBill.paymentDate) {
          setPaymentDate(new Date(existingBill.paymentDate).toISOString().split('T')[0]);
        }
      } else {
        // Reset current reading and load default last reading
        setCurrentReading('');
        setAmountPaid('0');
        setRentDue(renter.baseRent);
        if (renter.bills && renter.bills.length > 0) {
          const sortedBills = [...renter.bills].sort((a, b) => (Date.parse(b.month) || 0) - (Date.parse(a.month) || 0));
          setLastReading(sortedBills[0].currentReading);
        } else {
          setLastReading(renter.initialMeterReading);
        }
      }
    }
  }, [monthInput, renter]);

  // Calculations for display
  const last = Number(lastReading) || 0;
  const current = Number(currentReading) || 0;
  const rent = Number(rentDue) || 0;
  const paid = Number(amountPaid) || 0;
  
  const unitsConsumed = Math.max(0, current - last);
  const electricityBill = unitsConsumed * (renter ? renter.electricityRate : 0);
  const totalDue = rent + electricityBill;
  const balance = totalDue - paid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (current < last) {
      setError('Current electricity reading cannot be lower than the previous reading.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Admin token not found. Please log in.');
      setLoading(false);
      return;
    }

    const payload = {
      month: formatMonthName(monthInput),
      lastReading: last,
      currentReading: current,
      rentDue: rent,
      amountPaid: paid,
      paymentDate: paymentDate
    };

    try {
      const response = await fetch(`${backendUrl}/api/renters/${renter._id}/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record bill.');
      }

      onBillSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="modal-title">
          <Calculator className="text-primary" size={24} /> Record Bill & Payment
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Renter: <strong style={{ color: 'var(--text-primary)' }}>{renter?.name}</strong> (Rate: ₹{renter?.electricityRate}/unit)
        </p>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', width: '100%', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {existsWarning && (
          <div className="badge badge-warning" style={{ display: 'flex', gap: '0.5rem', width: '100%', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <Info size={16} />
            <span>A bill for <strong>{formatMonthName(monthInput)}</strong> already exists. Submitting will update it.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="bill-month">Select Month</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="bill-month"
                  type="month"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payment-date">Payment Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="payment-date"
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="last-reading">Previous Electricity Reading</label>
              <div style={{ position: 'relative' }}>
                <Zap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="last-reading"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. 1020"
                  value={lastReading}
                  onChange={(e) => setLastReading(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="current-reading">Current Electricity Reading</label>
              <div style={{ position: 'relative' }}>
                <Zap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="current-reading"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. 1150"
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="rent-due">Monthly Rent Due (₹)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="rent-due"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={rentDue}
                  onChange={(e) => setRentDue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="amount-paid">Amount Paid (₹)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="amount-paid"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-summary">
            <div className="form-summary-row">
              <span>Electricity Units:</span>
              <span>{unitsConsumed.toFixed(1)} units ({last} to {current})</span>
            </div>
            <div className="form-summary-row">
              <span>Electricity Cost (₹{renter?.electricityRate}/unit):</span>
              <span>₹{electricityBill.toFixed(2)}</span>
            </div>
            <div className="form-summary-row">
              <span>Monthly Rent:</span>
              <span>₹{rent.toFixed(2)}</span>
            </div>
            <div className="form-summary-row" style={{ color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total Dues for Month:</span>
              <span>₹{totalDue.toFixed(2)}</span>
            </div>
            <div className="form-summary-row" style={{ color: 'var(--primary)' }}>
              <span>Amount Paid:</span>
              <span>-₹{paid.toFixed(2)}</span>
            </div>
            <div className="form-summary-row" style={{ fontSize: '1.05rem', borderTop: '2px solid var(--glass-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Remaining Balance:</span>
              <span style={{ color: balance > 0 ? 'var(--warning)' : balance < 0 ? 'var(--primary)' : 'var(--text-primary)' }}>
                {balance >= 0 ? `₹${balance.toFixed(2)}` : `Refund ₹${Math.abs(balance).toFixed(2)}`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={loading || (currentReading !== '' && current < last)}
            >
              {loading ? 'Submitting...' : 'Record Bill & Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillForm;
