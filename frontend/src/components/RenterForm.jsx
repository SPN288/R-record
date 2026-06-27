import React, { useState, useEffect } from 'react';
import { User, Phone, DollarSign, Zap, Plus, Edit, X } from 'lucide-react';

const RenterForm = ({ renter, onClose, onRenterSaved, backendUrl }) => {
  const isEdit = !!renter;
  
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [baseRent, setBaseRent] = useState('');
  const [electricityRate, setElectricityRate] = useState('');
  const [initialMeterReading, setInitialMeterReading] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && renter) {
      setName(renter.name || '');
      setContactNumber(renter.contactNumber || '');
      setBaseRent(renter.baseRent || '');
      setElectricityRate(renter.electricityRate || '');
      setInitialMeterReading(renter.initialMeterReading || '');
    }
  }, [isEdit, renter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('You must be logged in as admin to perform this action');
      setLoading(false);
      return;
    }

    const payload = {
      name,
      contactNumber,
      baseRent: Number(baseRent),
      electricityRate: Number(electricityRate),
      initialMeterReading: Number(initialMeterReading)
    };

    const url = isEdit 
      ? `${backendUrl}/api/renters/${renter._id}` 
      : `${backendUrl}/api/renters`;
      
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save renter details.');
      }

      onRenterSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="modal-title">
          {isEdit ? <Edit className="text-secondary" size={24} /> : <Plus className="text-primary" size={24} />}
          {isEdit ? 'Edit Renter Profile' : 'Add New Renter'}
        </h3>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', width: '100%', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Renter Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactNumber">Contact Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="contactNumber"
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. +1 234 567 890"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="baseRent">Monthly Base Rent (₹)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="baseRent"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. 800"
                  value={baseRent}
                  onChange={(e) => setBaseRent(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="electricityRate">Electricity Rate (₹ / Unit)</label>
              <div style={{ position: 'relative' }}>
                <Zap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  id="electricityRate"
                  type="number"
                  step="0.001"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="e.g. 0.15"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="initialReading">Starting Electricity Meter Reading</label>
            <div style={{ position: 'relative' }}>
              <Zap size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="initialReading"
                type="number"
                step="any"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. 1045.2"
                value={initialMeterReading}
                onChange={(e) => setInitialMeterReading(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
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
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Renter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenterForm;
