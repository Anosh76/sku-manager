import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, LogOut } from 'lucide-react';
import './App.css';

const SKUManager = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);
  
  const [skuData, setSkuData] = useState(() => {
    const saved = localStorage.getItem('skuData');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [stones] = useState(['LL', 'A', 'SP', 'TO', 'AQ', 'EM', 'AME', 'NP', 'AJ', 'QU', 'ID', 'GA', 'PE', 'CT']);
  const [metals] = useState(['BR', 'SL', 'AU', 'CU', 'SS', 'LA']);
  const [products] = useState(['NL', 'R', 'B', 'ER', 'PD', 'BG', 'CL', 'ST', 'PT', 'CG', 'HD', 'FR', 'TM', 'TH']);
  const [corporateClients] = useState(['HBL', 'NUMS', 'DW']);
  
  const [activeTab, setActiveTab] = useState('generator');
  const [loading] = useState(false);
  
  const [formData, setFormData] = useState({
    stone: '', metal: '', product: '', type: 'product', corporateClient: '', customNumber: ''
  });

  // Save to localStorage whenever skuData changes
  useEffect(() => {
    localStorage.setItem('skuData', JSON.stringify(skuData));
  }, [skuData]);

  // Calculate stats
  const stats = {
    total: skuData.length,
    duplicates: 0,
    unique: skuData.length
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      alert('Please enter email and password');
      return;
    }
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', authForm.email);
    setIsLoggedIn(true);
    setAuthForm({ email: '', password: '' });
  };

  const generateSKU = () => {
    if (!formData.stone || !formData.metal || !formData.product) {
      alert('⚠️ Please select Stone, Metal, and Product');
      return;
    }

    let sku = `${formData.stone}-${formData.metal}-${formData.product}`;
    if (formData.type === 'corporate' && formData.corporateClient) {
      sku += `-${formData.corporateClient}`;
    }
    if (formData.customNumber) {
      sku += `-${formData.customNumber}`;
    }

    // Check for duplicates
    if (skuData.some(item => item.sku.toUpperCase() === sku.toUpperCase())) {
      alert('⚠️ This SKU already exists!');
      return;
    }

    const newSKU = {
      _id: Date.now().toString(),
      sku: sku,
      timestamp: new Date().toLocaleString()
    };

    setSkuData([...skuData, newSKU]);
    setFormData({ stone: '', metal: '', product: '', type: 'product', corporateClient: '', customNumber: '' });
    alert(`✅ SKU Generated: ${sku}`);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').map(line => line.trim()).filter(line => line && line !== 'SKU');
        
        let imported = 0;
        let duplicates = 0;

        const newSKUs = lines.map(sku => {
          if (skuData.some(item => item.sku.toUpperCase() === sku.toUpperCase())) {
            duplicates++;
            return null;
          }
          imported++;
          return {
            _id: Date.now().toString() + Math.random(),
            sku: sku.toUpperCase(),
            timestamp: new Date().toLocaleString()
          };
        }).filter(Boolean);

        setSkuData([...skuData, ...newSKUs]);
        alert(`✅ Imported ${imported} SKUs\n⚠️ ${duplicates} duplicates skipped`);
        e.target.value = '';
      } catch (error) {
        alert('Error: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const downloadCSV = () => {
    const csv = skuData.map(item => `${item.sku},${item.timestamp}`).join('\n');
    const header = 'SKU,Timestamp\n';
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + csv));
    element.setAttribute('download', `SKU_List_${new Date().toISOString().split('T')[0]}.csv`);
    element.click();
  };

  const deleteSKU = (id) => {
    if (window.confirm('Delete this SKU?')) {
      setSkuData(skuData.filter(item => item._id !== id));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setAuthForm({ email: '', password: '' });
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🔐 SKU Manager</h1>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
            <button type="submit">
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
            {isLogin ? 'Create Account' : 'Already have account?'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>📊 SKU Manager</h1>
          <p>Total: <strong>{stats.total}</strong> | Duplicates: <strong>{stats.duplicates}</strong> | Unique: <strong>{stats.unique}</strong></p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} /> Logout
        </button>
      </header>

      <div className="tabs">
        <button className={activeTab === 'generator' ? 'tab active' : 'tab'} onClick={() => setActiveTab('generator')}>
          🔧 Generator
        </button>
        <button className={activeTab === 'manage' ? 'tab active' : 'tab'} onClick={() => setActiveTab('manage')}>
          📊 Manage
        </button>
      </div>

      {activeTab === 'generator' && (
        <div className="content generator">
          <h2>Generate New SKU</h2>
          <div className="form-grid">
            <div>
              <label>Stone</label>
              <select value={formData.stone} onChange={(e) => setFormData({ ...formData, stone: e.target.value })}>
                <option value="">Select Stone...</option>
                {stones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Metal</label>
              <select value={formData.metal} onChange={(e) => setFormData({ ...formData, metal: e.target.value })}>
                <option value="">Select Metal...</option>
                {metals.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label>Product</label>
              <select value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })}>
                <option value="">Select Product...</option>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="product">Product</option>
                <option value="corporate">Corporate Client</option>
              </select>
            </div>
            {formData.type === 'corporate' && (
              <div>
                <label>Corporate Client</label>
                <select value={formData.corporateClient} onChange={(e) => setFormData({ ...formData, corporateClient: e.target.value })}>
                  <option value="">Select Client...</option>
                  {corporateClients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label>Custom Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., 001" 
                value={formData.customNumber} 
                onChange={(e) => setFormData({ ...formData, customNumber: e.target.value })} 
              />
            </div>
          </div>
          <button onClick={generateSKU} className="btn btn-primary">
            <Plus size={20} /> Generate SKU
          </button>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="content manage">
          <div className="upload-section">
            <label className="upload-box">
              <Upload size={24} />
              <span>Import from CSV</span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} />
            </label>
          </div>

          <div className="table-section">
            <div className="table-header">
              <h2>All SKUs ({skuData.length})</h2>
              <button onClick={downloadCSV} className="btn btn-success" disabled={skuData.length === 0}>
                <Download size={18} /> Download CSV
              </button>
            </div>

            {loading ? (
              <p className="loading">Loading...</p>
            ) : skuData.length === 0 ? (
              <p className="empty">No SKUs yet. Generate or import some!</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuData.map((item) => (
                      <tr key={item._id}>
                        <td className="sku-cell"><code>{item.sku}</code></td>
                        <td>{item.timestamp}</td>
                        <td className="action-cell">
                          <button onClick={() => deleteSKU(item._id)} className="btn-delete">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SKUManager;