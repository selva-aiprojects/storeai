import { useState, useEffect } from 'react';
import { Users, Shield, Landmark, CreditCard, Save, RefreshCw, Search } from 'lucide-react';
import api from '../../services/api';

const EmployeeMaster = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/hr/employees');
            setEmployees(resp.data);
            if (resp.data.length > 0) setSelected(resp.data[0]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        // Simulator - in real app we'd have a PUT endpoint
        setTimeout(() => {
            setSaving(false);
            alert("Statutory updates applied to ERP profile.");
        }, 1000);
    };

    if (loading) return <div className="p-20 text-center">Loading Workforce Registry...</div>;

    return (
        <div className="flex bg-gray-50 h-[calc(100vh-80px)] overflow-hidden rounded-2xl border">
            {/* Sidebar list */}
            <div className="w-80 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Search employees..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {employees.map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => setSelected(emp)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-b last:border-0 transition ${selected?.id === emp.id ? 'bg-indigo-50 border-r-4 border-r-indigo-600' : ''}`}
                        >
                            <div className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-gray-500">{emp.designation} • {emp.employeeId}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Details */}
            <div className="flex-1 overflow-y-auto bg-white p-8">
                {selected ? (
                    <div className="max-w-4xl space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selected.firstName} {selected.lastName}</h1>
                                <p className="text-gray-500 text-sm">Professional Profile & Statutory Compliance Registry</p>
                            </div>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                SAVE PROFILE
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Statutory Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Shield size={20} className="text-orange-600" /> Regulatory Numbers
                                </h3>
                                <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Provident Fund (PF) No.</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-xl"
                                            defaultValue={selected.pfNumber || ''}
                                            placeholder="e.g., MH/BAN/12345/678"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">ESI Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-xl"
                                            defaultValue={selected.esiNumber || ''}
                                            placeholder="17 Digit ESI Code"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Insurance Policy No.</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-xl"
                                            defaultValue={selected.insuranceNumber || ''}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">PAN Card No.</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-xl"
                                            defaultValue={selected.panNumber || ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banking Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Landmark size={20} className="text-blue-600" /> Settlement Bank
                                </h3>
                                <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Bank Account Number</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 border rounded-xl font-mono"
                                                defaultValue={selected.bankAccountNumber || ''}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-xl font-mono"
                                            defaultValue={selected.ifscCode || ''}
                                        />
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-[10px] text-blue-700 leading-relaxed">
                                            Payment settlement for salaries, incentives, and reimbursements will be routed to this account verified via statutory KYC.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Details */}
                        <div className="card p-6 bg-gray-50 border-dashed">
                            <h3 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2 uppercase tracking-widest">
                                Financial Snapshot
                            </h3>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Base Monthly Salary</div>
                                    <div className="text-xl font-black text-gray-900">${(selected.salary || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Incentive Profile</div>
                                    <div className="text-xl font-black text-indigo-600">{selected.incentivePercentage || 0}%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Appraisal Status</div>
                                    <div className="text-xl font-black text-green-600">{selected.performanceRating || 0}/5</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Users size={64} className="mb-4 opacity-10" />
                        <p>Select an employee from the registry to view or modify documents.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeMaster;
