import React, { useEffect } from 'react';
import { Settings, FileDown, Printer, MapPin, Edit3 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import './SettingsPanel.css';

export function SettingsPanel({ settings, onUpdate, onDownload, onPrint, onManagePrinters }) {
  const groups = useLiveQuery(() => db.printerGroups.toArray());

  // Load active group from localStorage on mount
  useEffect(() => {
    const savedGroupId = localStorage.getItem('activeGroupId');
    if (savedGroupId && onUpdate) {
      onUpdate('activeGroupId', parseInt(savedGroupId));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onUpdate(name, value);
  };

  const handleGroupChange = (e) => {
    const id = e.target.value;
    onUpdate('activeGroupId', id ? parseInt(id) : '');
    if (id) {
      localStorage.setItem('activeGroupId', id);
    }
  };

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <div className="header-title">
          <Settings size={16} />
          <h3>Settings</h3>
        </div>
      </div>

      {/* Location / Printer Group Selector */}
      <div className="location-selector-section">
        <label><MapPin size={12} /> Print Location</label>
        <div className="location-row">
          <select
            value={settings.activeGroupId || ''}
            onChange={handleGroupChange}
            className="location-select"
          >
            <option value="">-- Select Location --</option>
            {groups?.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button className="manage-btn" onClick={onManagePrinters} title="Manage Printers">
            <Edit3 size={14} />
          </button>
        </div>
      </div>

      <div className="divider"></div>

      <div className="panel-header-small">
        <h3>Layout (mm)</h3>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <label>Page Width</label>
          <input type="number" name="pageWidth" value={settings.pageWidth} onChange={handleChange} />
        </div>
        {/* Page Height Removed */}

        <div className="setting-group">
          <label>Label Width</label>
          <input type="number" name="labelWidth" value={settings.labelWidth} onChange={handleChange} />
        </div>
        <div className="setting-group">
          <label>Label Height</label>
          <input type="number" name="labelHeight" value={settings.labelHeight} onChange={handleChange} />
        </div>

        {/* Rows & Columns Removed */}

        <div className="setting-group">
          <label>Margin Top</label>
          <input type="number" name="marginTop" value={settings.marginTop} onChange={handleChange} />
        </div>
        <div className="setting-group">
          <label>Margin Left</label>
          <input type="number" name="marginLeft" value={settings.marginLeft} onChange={handleChange} />
        </div>

        <div className="setting-group">
          <label>Gap X (Horiz)</label>
          <input type="number" name="gapX" value={settings.gapX} onChange={handleChange} />
        </div>
        <div className="setting-group">
          <label>Gap Y (Vert)</label>
          <input type="number" name="gapY" value={settings.gapY} onChange={handleChange} />
        </div>
      </div>

      <div className="actions">
        <button className="print-btn" onClick={onPrint}>
          <Printer size={16} />
          Direct Print
        </button>
        <button className="pdf-btn" onClick={onDownload}>
          <FileDown size={16} />
          Download PDF
        </button>
      </div>
    </div>
  );
}
