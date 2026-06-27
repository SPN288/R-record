import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Zap, Plus, LogIn, LogOut, Search, 
  Trash2, Edit, PlusCircle, History, Shield, AlertCircle
} from 'lucide-react';
import AdminLogin from './components/AdminLogin';
import RenterForm from './components/RenterForm';
import BillForm from './components/BillForm';
import RenterHistory from './components/RenterHistory';
import { generatePDFReport } from './utils/pdfGenerator';

const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [renters, setRenters] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal toggles
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRenterModal, setShowRenterModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Selected Renter for Edit / Record Bill / History view
  const [selectedRenter, setSelectedRenter] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Renters on mount and whenever action succeeds
  const fetchRenters = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/renters`);
      if (!response.ok) throw new Error('Failed to fetch renters database');
      const data = await response.json();
      setRenters(data);
    } catch (error) {
      console.error(error);
      setErrorMsg('Could not connect to database server. Make sure backend is running.');
    }
  };

  // Verify if stored token is still valid
  const verifyToken = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setIsAdmin(true);
      } else {
        // Token expired/invalid
        handleLogout();
      }
    } catch (err) {
      console.error('Error verifying token:', err);
    }
  };

  useEffect(() => {
    fetchRenters();
    verifyToken();
  }, []);

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    showNotification('Welcome, Administrator!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdmin(false);
    showNotification('Logged out successfully', 'success');
  };

  const showNotification = (msg, type) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleRenterSaved = (renterData) => {
    fetchRenters();
    showNotification('Renter profile saved successfully!', 'success');
  };

  const handleBillSaved = (renterData) => {
    fetchRenters();
    showNotification('Bill and payment details recorded!', 'success');
  };

  const handleDeleteRenter = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove renter ${name}? This will delete all their billing history.`)) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('Admin privileges required', 'error');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/renters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete renter');

      showNotification(`${name} was deleted successfully.`, 'success');
      fetchRenters();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Helper calculations for Stats
  const totalRenters = renters.length;
  
  let totalRevenueCollected = 0;
  let totalOutstandingDues = 0;
  let totalElectricityUsage = 0;

  renters.forEach(renter => {
    if (renter.bills && renter.bills.length > 0) {
      renter.bills.forEach(bill => {
        totalRevenueCollected += bill.amountPaid;
        totalOutstandingDues += bill.balance;
        totalElectricityUsage += (bill.currentReading - bill.lastReading);
      });
    }
  });

  // Filter renters list based on search bar
  const filteredRenters = renters.filter(renter => 
    renter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    renter.contactNumber.includes(searchQuery)
  );

  // Helper to calculate custom individual renter outstanding dues
  const getRenterOutstanding = (renter) => {
    if (!renter.bills || renter.bills.length === 0) return 0;
    return renter.bills.reduce((sum, bill) => sum + bill.balance, 0);
  };

  // Helper to get latest reading info
  const getLatestReadingInfo = (renter) => {
    if (!renter.bills || renter.bills.length === 0) {
      return { last: renter.initialMeterReading, current: renter.initialMeterReading, units: 0 };
    }
    const sorted = [...renter.bills].sort((a, b) => (Date.parse(b.month) || 0) - (Date.parse(a.month) || 0));
    const latest = sorted[0];
    return {
      last: latest.lastReading,
      current: latest.currentReading,
      units: latest.currentReading - latest.lastReading
    };
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar glass-panel">
        <div className="logo-container">
          <div className="logo-icon">🔑</div>
          <span className="logo-text">SPN rent management</span>
        </div>
        
        <div className="navbar-actions">
          {isAdmin ? (
            <>
              <div className="badge badge-success" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <Shield size={14} /> Admin Mode
              </div>
              <button className="btn btn-secondary" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
              <LogIn size={16} /> Admin Login
            </button>
          )}
        </div>
      </nav>

      {/* Notifications */}
      {successMsg && (
        <div className="badge badge-success" style={{ display: 'block', width: '100%', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          ✨ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="badge badge-danger" style={{ display: 'block', width: '100%', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Hero Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card glass-panel primary">
          <div className="stat-header">
            <span>Total Active Renters</span>
            <div className="stat-icon"><Users size={18} /></div>
          </div>
          <div className="stat-value">{totalRenters}</div>
          <div className="stat-footer">Manage and track rents</div>
        </div>

        {isAdmin && (
          <div className="stat-card glass-panel">
            <div className="stat-header">
              <span>Revenue Collected</span>
              <div className="stat-icon" style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)' }}><DollarSign size={18} /></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>${totalRevenueCollected.toFixed(2)}</div>
            <div className="stat-footer">Aggregated total paid</div>
          </div>
        )}

        {isAdmin && (
          <div className="stat-card glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="stat-header">
              <span>Outstanding Balance</span>
              <div className="stat-icon" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}><AlertCircle size={18} /></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>${totalOutstandingDues.toFixed(2)}</div>
            <div className="stat-footer">Rent + Electricity due</div>
          </div>
        )}

        <div className="stat-card glass-panel secondary">
          <div className="stat-header">
            <span>Electricity Dispatched</span>
            <div className="stat-icon"><Zap size={18} /></div>
          </div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{totalElectricityUsage.toFixed(1)} <span style={{ fontSize: '1rem' }}>Units</span></div>
          <div className="stat-footer">Total consumed power</div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="dashboard-actions">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search renter by name or contact..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => generatePDFReport(renters)}
                disabled={renters.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                📥 Download PDF Report
              </button>
              <button className="btn btn-primary" onClick={() => { setSelectedRenter(null); setShowRenterModal(true); }}>
                <Plus size={18} /> Add Renter
              </button>
            </div>
          )}
        </div>

        {/* Renters Table / List */}
        {filteredRenters.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" size={48} />
            <h4>No Renters Found</h4>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {searchQuery ? 'Try adjusting your search filters' : 'Add new renters from the Admin Panel to begin management'}
            </p>
          </div>
        ) : (
          <div className="renters-table-container">
            <table className="renters-table">
              <thead>
                <tr>
                  <th>Renter Profile</th>
                  <th>Rate & Base Rent</th>
                  <th>Electricity Readings</th>
                  <th>Dues / Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRenters.map((renter) => {
                  const outstanding = getRenterOutstanding(renter);
                  const readingInfo = getLatestReadingInfo(renter);
                  
                  return (
                    <tr key={renter._id}>
                      <td>
                        <div className="renter-profile">
                          <span className="renter-name">{renter.name}</span>
                          <span className="renter-contact">{renter.contactNumber}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>Rent: ${renter.baseRent}/mo</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Elec: ${renter.electricityRate}/unit
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          Current: <strong style={{ color: 'var(--text-primary)' }}>{readingInfo.current}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Previous: {readingInfo.last} | Consumed: {readingInfo.units.toFixed(1)} units
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className={`badge ${outstanding > 0 ? 'badge-danger' : 'badge-success'}`}>
                            {outstanding > 0 ? `Dues: $${outstanding.toFixed(2)}` : 'Fully Paid'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-icon" 
                            title="Statement History"
                            onClick={() => { setSelectedRenter(renter); setShowHistoryModal(true); }}
                          >
                            <History size={16} />
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button 
                                className="btn btn-secondary btn-icon" 
                                style={{ color: 'var(--primary)' }}
                                title="Add Bill / Record Payment"
                                onClick={() => { setSelectedRenter(renter); setShowBillModal(true); }}
                              >
                                <PlusCircle size={16} />
                              </button>
                              
                              <button 
                                className="btn btn-secondary btn-icon" 
                                title="Edit Profile"
                                onClick={() => { setSelectedRenter(renter); setShowRenterModal(true); }}
                              >
                                <Edit size={16} />
                              </button>

                              <button 
                                className="btn btn-secondary btn-icon" 
                                style={{ color: 'var(--danger)' }}
                                title="Remove Renter"
                                onClick={() => handleDeleteRenter(renter._id, renter.name)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals Section */}
      {showLoginModal && (
        <AdminLogin 
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          backendUrl={BACKEND_URL}
        />
      )}

      {showRenterModal && (
        <RenterForm 
          renter={selectedRenter}
          onClose={() => { setShowRenterModal(false); setSelectedRenter(null); }}
          onRenterSaved={handleRenterSaved}
          backendUrl={BACKEND_URL}
        />
      )}

      {showBillModal && (
        <BillForm 
          renter={selectedRenter}
          onClose={() => { setShowBillModal(false); setSelectedRenter(null); }}
          onBillSaved={handleBillSaved}
          backendUrl={BACKEND_URL}
        />
      )}

      {showHistoryModal && (
        <RenterHistory 
          renter={selectedRenter}
          onClose={() => { setShowHistoryModal(false); setSelectedRenter(null); }}
        />
      )}
    </div>
  );
}

export default App;
