import { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Percent, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ConfigSettings = () => {
    const [configs, setConfigs] = useState({
        maxCreditDays: 50,
        defaultGst: 18,
        enforceApproval: true,
        allowPartialReturns: true
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        // Simulate save
        setTimeout(() => {
            setLoading(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1000);
    };

    return (
        <div className="max-w-4xl space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Financial Policy & Configurations</h1>
                <p className="text-gray-500 text-sm">Manage tenant-level accounting rules and global tax rates</p>
            </header>

            <div className="grid gap-6">
                {/* Credit Policy */}
                <div className="card p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Credit & Liability Policy</h3>
                            <p className="text-xs text-gray-500">Define the aging threshold for accounts receivable</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Max Credit Days</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border rounded-xl"
                                value={configs.maxCreditDays}
                                onChange={(e) => setConfigs({ ...configs, maxCreditDays: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-gray-400">Aging analysis will trigger CRITICAL alert after this period.</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                            <AlertTriangle size={16} className="text-orange-600 shrink-0 mt-1" />
                            <p className="text-[10px] text-orange-700 leading-relaxed">
                                WARNING: Shortening this limit will immediately mark many existing sales as "Overdue" in the Liability Tracker.
                            </p>
                        </div>
                    </div>
                </div>

                {/* GST Policy */}
                <div className="card p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Percent size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Global Taxation (GST)</h3>
                            <p className="text-xs text-gray-500">Set default tax rates for new products and reconciliation</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Default Output GST Rate (%)</h4>
                                <p className="text-[10px] text-gray-400">Used when product-specific rate is not defined.</p>
                            </div>
                            <input
                                type="number"
                                className="w-24 px-4 py-2 border rounded-lg text-right font-bold"
                                value={configs.defaultGst}
                                onChange={(e) => setConfigs({ ...configs, defaultGst: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Operation Controls */}
                <div className="card p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Operational Guardrails</h3>
                            <p className="text-xs text-gray-500">Control approval workflows for daybook and returns</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100">
                            <input
                                type="checkbox"
                                checked={configs.enforceApproval}
                                onChange={(e) => setConfigs({ ...configs, enforceApproval: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                            />
                            <div>
                                <span className="text-sm font-bold text-gray-800">Enforce Daybook Approval</span>
                                <p className="text-[10px] text-gray-400">All automated expense entries require P&L Auditor sign-off.</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100">
                            <input
                                type="checkbox"
                                checked={configs.allowPartialReturns}
                                onChange={(e) => setConfigs({ ...configs, allowPartialReturns: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                            />
                            <div>
                                <span className="text-sm font-bold text-gray-800">Allow Partial Sales Returns</span>
                                <p className="text-[10px] text-gray-400">Enables selecting specific items from an invoice for refund.</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pb-12">
                <button className="btn btn-secondary">DISCARD CHANGES</button>
                <button
                    className={`btn btn-primary px-8 flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    {saved ? 'SETTINGS SAVED!' : 'APPLY CONFIGURATIONS'}
                </button>
            </div>
        </div>
    );
};

export default ConfigSettings;
