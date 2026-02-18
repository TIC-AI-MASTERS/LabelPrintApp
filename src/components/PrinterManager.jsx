import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Plus, Save, Printer } from 'lucide-react';
import './PrinterManager.css';

export function PrinterManager({ onClose }) {
    const groups = useLiveQuery(() => db.printerGroups.toArray());
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        permanentPrinter: { name: '', width: 102.5, height: 32.5, orientation: 'portrait' },
        nonPermanentPrinter: { name: '', width: 102.5, height: 32.5, orientation: 'portrait' }
    });

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setFormData(group);
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        const newGroup = {
            name: 'New Location',
            permanentPrinter: { name: '', width: 102.5, height: 32.5, orientation: 'portrait' },
            nonPermanentPrinter: { name: '', width: 102.5, height: 32.5, orientation: 'portrait' }
        };
        setSelectedGroup(null); // It's new, not saved yet
        setFormData(newGroup);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Please enter a location name");

        try {
            if (formData.id) {
                await db.printerGroups.update(formData.id, formData);
            } else {
                await db.printerGroups.add(formData);
            }
            setIsEditing(false);
            setSelectedGroup(null);
        } catch (err) {
            console.error("Failed to save group:", err);
            alert("Error saving location");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this location?")) {
            await db.printerGroups.delete(id);
            if (selectedGroup?.id === id) {
                setIsEditing(false);
                setSelectedGroup(null);
            }
        }
    };

    const updatePrinterConfig = (type, field, value) => {
        setFormData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: field === 'width' || field === 'height' ? parseFloat(value) : value
            }
        }));
    };

    return (
        <div className="printer-manager-overlay">
            <div className="printer-manager-modal">
                <div className="pm-header">
                    <h2>Printer Locations</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="pm-content">
                    <div className="pm-sidebar">
                        <div className="list-header">
                            <span>Locations</span>
                            <button className="add-btn-small" onClick={handleCreateNew}><Plus size={14} /></button>
                        </div>
                        <ul>
                            {groups?.map(g => (
                                <li key={g.id} className={selectedGroup?.id === g.id ? 'active' : ''}>
                                    <span onClick={() => handleSelectGroup(g)}>{g.name}</span>
                                    <button className="delete-icon" onClick={() => handleDelete(g.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pm-main">
                        {isEditing ? (
                            <div className="edit-form">
                                <div className="form-row">
                                    <label>Location Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="printer-configs">
                                    {/* Permanent Printer Config */}
                                    <div className="config-box">
                                        <h4><Printer size={14} /> Permanent Sticker Printer</h4>
                                        <div className="field">
                                            <label>Printer Name (Exact)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. ZDesigner GK420t"
                                                value={formData.permanentPrinter.name}
                                                onChange={e => updatePrinterConfig('permanentPrinter', 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="row-2">
                                            <div className="field">
                                                <label>Page Width (mm)</label>
                                                <input
                                                    type="number"
                                                    value={formData.permanentPrinter.width}
                                                    onChange={e => updatePrinterConfig('permanentPrinter', 'width', e.target.value)}
                                                />
                                            </div>
                                            <div className="field">
                                                <label>Height (mm)</label>
                                                <input
                                                    type="number"
                                                    value={formData.permanentPrinter.height}
                                                    onChange={e => updatePrinterConfig('permanentPrinter', 'height', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="field">
                                            <label>Orientation</label>
                                            <select
                                                value={formData.permanentPrinter.orientation}
                                                onChange={e => updatePrinterConfig('permanentPrinter', 'orientation', e.target.value)}
                                            >
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Non-Permanent Printer Config */}
                                    <div className="config-box">
                                        <h4><Printer size={14} /> Non-Permanent / Paper Printer</h4>
                                        <div className="field">
                                            <label>Printer Name (Exact)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. HP PageWide..."
                                                value={formData.nonPermanentPrinter.name}
                                                onChange={e => updatePrinterConfig('nonPermanentPrinter', 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="row-2">
                                            <div className="field">
                                                <label>Page Width (mm)</label>
                                                <input
                                                    type="number"
                                                    value={formData.nonPermanentPrinter.width}
                                                    onChange={e => updatePrinterConfig('nonPermanentPrinter', 'width', e.target.value)}
                                                />
                                            </div>
                                            <div className="field">
                                                <label>Height (mm)</label>
                                                <input
                                                    type="number"
                                                    value={formData.nonPermanentPrinter.height}
                                                    onChange={e => updatePrinterConfig('nonPermanentPrinter', 'height', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="field">
                                            <label>Orientation</label>
                                            <select
                                                value={formData.nonPermanentPrinter.orientation}
                                                onChange={e => updatePrinterConfig('nonPermanentPrinter', 'orientation', e.target.value)}
                                            >
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button className="save-btn" onClick={handleSave}><Save size={14} /> Save Configuration</button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">Select a location to edit or create new</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
