import React from 'react';
import { X, Calendar, Zap, DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const RenterHistory = ({ renter, onClose }) => {
  const tableContainerRef = React.useRef(null);

  // Sort bills by month in ascending order (oldest first, newest last)
  const sortedBills = renter.bills 
    ? [...renter.bills].sort((a, b) => (Date.parse(a.month) || 0) - (Date.parse(b.month) || 0)) 
    : [];

  const totalRentDue = renter.bills ? renter.bills.reduce((sum, b) => sum + b.rentDue, 0) : 0;
  const totalElecDue = renter.bills ? renter.bills.reduce((sum, b) => sum + b.electricityBillDue, 0) : 0;
  const totalDues = totalRentDue + totalElecDue;
  const totalPaid = renter.bills ? renter.bills.reduce((sum, b) => sum + b.amountPaid, 0) : 0;
  const totalOutstanding = totalDues - totalPaid;

  const currentReading = sortedBills.length > 0 
    ? sortedBills[sortedBills.length - 1].currentReading 
    : renter.initialMeterReading;

  // Scroll to bottom (newest data) automatically on mount
  React.useEffect(() => {
    if (sortedBills.length > 0) {
      const timer = setTimeout(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sortedBills.length]);

  const scrollToNewest = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: tableContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '750px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="modal-title">
          <FileText className="text-secondary" size={24} /> {renter.name}'s Statement & Billing History
        </h3>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <span>Phone: <strong style={{ color: 'var(--text-primary)' }}>{renter.contactNumber}</strong></span>
          <span>Monthly Rent: <strong style={{ color: 'var(--text-primary)' }}>₹{renter.baseRent}</strong></span>
          <span>Elec. Rate: <strong style={{ color: 'var(--text-primary)' }}>₹{renter.electricityRate}/unit</strong></span>
          <span>Current Meter Reading: <strong style={{ color: 'var(--text-primary)' }}>{currentReading}</strong></span>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ 
            padding: '1rem 2rem', 
            borderLeft: `4px solid ${totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)'}`,
            background: 'rgba(255,255,255,0.01)',
            flex: '1',
            maxWidth: '300px'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Balance</div>
            <div style={{ 
              fontSize: '1.6rem', 
              fontWeight: '700', 
              marginTop: '0.25rem', 
              fontFamily: 'var(--font-display)',
              color: totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)'
            }}>
              ₹{totalOutstanding.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', margin: 0 }}>Monthly Invoices</h4>
          {sortedBills.length > 0 && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={scrollToNewest}
            >
              ↓ Go to Newest
            </button>
          )}
        </div>

        {sortedBills.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <Calendar className="empty-state-icon" size={32} />
            <p style={{ color: 'var(--text-secondary)' }}>No billing periods recorded yet.</p>
          </div>
        ) : (
          <div ref={tableContainerRef} style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <table className="renters-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Month</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Electricity Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Charges (₹)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Paid (₹)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {sortedBills.map((bill, index) => {
                  const elecUsage = bill.currentReading - bill.lastReading;
                  return (
                    <tr key={index}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>
                        {bill.month}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                        <div>Usage: {elecUsage.toFixed(1)} units</div>
                        <div style={{ fontSize: '0.75rem' }}>({bill.lastReading} → {bill.currentReading})</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>Rent: ₹{bill.rentDue.toFixed(2)}</div>
                        <div>Elec: ₹{bill.electricityBillDue.toFixed(2)}</div>
                        <div style={{ fontWeight: '600', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                          Total: ₹{bill.totalDue.toFixed(2)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                          ₹{bill.amountPaid.toFixed(2)}
                        </div>
                        {bill.paymentDate && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(bill.paymentDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                        <span style={{ 
                          fontWeight: '600',
                          color: bill.balance > 0 ? 'var(--warning)' : bill.balance < 0 ? 'var(--primary)' : 'var(--text-secondary)'
                        }}>
                          ₹{bill.balance.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenterHistory;
