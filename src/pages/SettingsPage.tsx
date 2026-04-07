import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { businessSettings, updateBusinessSettings } = useApp();
  const [name, setName] = useState(businessSettings.businessName);
  const [address, setAddress] = useState(businessSettings.address);
  const [phone, setPhone] = useState(businessSettings.phone);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateBusinessSettings({ businessName: name, address, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="win7-titlebar">⚙️ Business Settings</div>
      <div className="win7-panel" style={{ padding: 20, borderTop: 'none' }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Business Name (shown on receipt)</label>
          <input className="win7-input" style={{ width: '100%' }} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Address</label>
          <input className="win7-input" style={{ width: '100%' }} value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 12 }}>Phone</label>
          <input className="win7-input" style={{ width: '100%' }} value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <button className="win7-btn win7-btn-primary" style={{ padding: '6px 20px' }} onClick={handleSave}>
          <Save size={14} style={{ marginRight: 6, display: 'inline' }} />
          Save Settings
        </button>
        {saved && <span style={{ marginLeft: 12, color: 'hsl(120 45% 35%)', fontSize: 12, fontWeight: 600 }}>✓ Saved!</span>}
      </div>
    </div>
  );
}
