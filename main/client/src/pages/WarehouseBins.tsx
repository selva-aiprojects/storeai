import React, { useState } from 'react';
import { Warehouse as WarehouseIcon, MapPin, Plus, X, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function WarehouseBins() {
    const [warehouses, setWarehouses] = useState([
        { id: 'WH-MAIN', name: 'Central Fulfillment Hub', location: 'Mumbai Central Zone', bins: 140, isFulfillmentCenter: true },
        { id: 'WH-EAST', name: 'Eastern Regional Warehouse', location: 'Kolkata Industrial Park', bins: 65, isFulfillmentCenter: false },
    ]);

    const [bins, setBins] = useState([
        { binCode: 'BIN-A1-R02-B09', warehouse: 'Central Fulfillment Hub', zone: 'Zone A (Fast Movers)', aisle: 'Aisle 1', rack: 'Rack 2', capacity: '85%' },
        { binCode: 'BIN-B4-R01-B03', warehouse: 'Central Fulfillment Hub', zone: 'Zone B (Bulk Storage)', aisle: 'Aisle 4', rack: 'Rack 1', capacity: '40%' },
        { binCode: 'BIN-C2-R05-B12', warehouse: 'Eastern Regional Warehouse', zone: 'Zone C (Cold Storage)', aisle: 'Aisle 2', rack: 'Rack 5', capacity: '92%' },
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBin, setNewBin] = useState({
        binCode: '',
        warehouse: 'Central Fulfillment Hub',
        zone: 'Zone A (Fast Movers)',
        aisle: 'Aisle 1',
        rack: 'Rack 1',
        capacity: '10%'
    });

    const handleAddBinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = newBin.binCode.trim() || `BIN-Z${Math.floor(Math.random() * 9 + 1)}-R01-B0${bins.length + 1}`;

        const created = {
            binCode: code,
            warehouse: newBin.warehouse,
            zone: newBin.zone,
            aisle: newBin.aisle,
            rack: newBin.rack,
            capacity: newBin.capacity
        };

        setBins(prev => [created, ...prev]);
        setNewBin({ binCode: '', warehouse: 'Central Fulfillment Hub', zone: 'Zone A (Fast Movers)', aisle: 'Aisle 1', rack: 'Rack 1', capacity: '10%' });
        setIsAddModalOpen(false);
    };

    return (
        <div className="space-y-6 font-['Outfit']">
            <PageHeader
                title="Warehouse & Bin Location (WMS)"
                subtitle="Manage fulfillment hubs, zone aisle rack bin locations & inter-warehouse transfers"
                icon={WarehouseIcon}
                badge={`${bins.length} BINS ACTIVE`}
                badgeColor="sky"
                iconGradient="from-sky-500 to-indigo-600"
                actions={
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Plus className="w-4 h-4" /> Add Storage Bin Location
                    </button>
                }
            />

            {/* Warehouse Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {warehouses.map(wh => (
                    <div key={wh.id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded">{wh.id}</span>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{wh.name}</h3>
                            </div>
                            {wh.isFulfillmentCenter && (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                                    Primary Fulfillment
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {wh.location}</p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span>Total Storage Bins: {wh.bins}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Storage Bin Hierarchy Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Storage Bin Hierarchy</h3>
                    <span className="text-xs text-sky-600 font-bold">{bins.length} Bins Registered</span>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <th className="p-4">Bin Code</th>
                            <th className="p-4">Warehouse</th>
                            <th className="p-4">Zone</th>
                            <th className="p-4">Aisle / Rack</th>
                            <th className="p-4">Occupancy</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                        {bins.map((b, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                <td className="p-4 font-bold text-sky-600 dark:text-sky-400">{b.binCode}</td>
                                <td className="p-4 font-medium text-slate-900 dark:text-white">{b.warehouse}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{b.zone}</td>
                                <td className="p-4 text-slate-500">{b.aisle} • {b.rack}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 font-extrabold text-[10px] rounded-md">
                                        {b.capacity} Occupied
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADD BIN MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-extrabold text-base">Add Storage Bin Location</h3>
                            <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white" onClick={() => setIsAddModalOpen(false)} />
                        </div>

                        <form onSubmit={handleAddBinSubmit} className="space-y-3.5 text-xs font-medium">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Warehouse Facility</label>
                                <select
                                    value={newBin.warehouse}
                                    onChange={e => setNewBin({ ...newBin, warehouse: e.target.value })}
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Bin Location Code</label>
                                <input
                                    type="text"
                                    value={newBin.binCode}
                                    onChange={e => setNewBin({ ...newBin, binCode: e.target.value })}
                                    placeholder="e.g. BIN-A2-R04-B18"
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Zone</label>
                                    <input
                                        type="text"
                                        value={newBin.zone}
                                        onChange={e => setNewBin({ ...newBin, zone: e.target.value })}
                                        placeholder="Zone A"
                                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Aisle / Rack</label>
                                    <input
                                        type="text"
                                        value={newBin.aisle}
                                        onChange={e => setNewBin({ ...newBin, aisle: e.target.value })}
                                        placeholder="Aisle 1"
                                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle className="w-4 h-4" /> Register Bin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
