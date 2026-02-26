import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Receipt, FileText, Download, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const PayrollEngine = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [slips, setSlips] = useState<Record<string, any>>({});

    // Month/Year select
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const resp = await api.get('/hr/employees');
            setEmployees(resp.data);
            setLoading(false);
        };
        fetch();
    }, []);

    const processPayroll = async (empId: string) => {
        setProcessing(empId);
        try {
            const resp = await api.post('/hr/payroll/process', { employeeId: empId, month, year });
            const slipResp = await api.get(`/hr/payroll/slip?employeeId=${empId}&month=${month}&year=${year}`);
            setSlips(prev => ({ ...prev, [empId]: slipResp.data }));
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Engine</h1>
                    <p className="text-gray-500 text-sm">Monthly salary processing, statutory deductions, and payout</p>
                </div>
                <div className="flex gap-4">
                    <select className="px-4 py-2 border rounded-xl bg-white font-bold" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                        <option value={1}>January</option>
                        <option value={2}>February</option>
                        <option value={9}>September</option>
                        <option value={10}>October</option>
                        <option value={12}>December</option>
                    </select>
                    <select className="px-4 py-2 border rounded-xl bg-white font-bold" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Employee List */}
                <div className="lg:col-span-2 card p-0 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b font-bold text-xs text-gray-400 uppercase tracking-widest">
                        Workforce Payroll Management
                    </div>
                    <div className="divide-y">
                        {employees.map(emp => {
                            const slip = slips[emp.id];
                            return (
                                <div key={emp.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center font-bold">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                                            <div className="text-xs text-gray-500">{emp.designation} • Base: ₹{emp.salary?.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {slip ? (
                                            <div className="text-right mr-4">
                                                <div className="text-xs text-gray-400">Net Payable</div>
                                                <div className="text-lg font-black text-green-600">₹{slip.netAmount?.toLocaleString()}</div>
                                            </div>
                                        ) : null}

                                        <button
                                            onClick={() => processPayroll(emp.id)}
                                            disabled={processing === emp.id}
                                            className={`btn ${slip ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
                                        >
                                            {processing === emp.id ? <RefreshCw className="animate-spin" size={16} /> : <Receipt size={16} />}
                                            {slip ? 'RE-PROCESS' : 'GENERATE SLIP'}
                                        </button>

                                        {slip && (
                                            <button className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg">
                                                <Download size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payroll Summary / Policies */}
                <div className="space-y-6">
                    <div className="card p-6 bg-sky-900 text-white">
                        <h3 className="text-lg font-bold mb-4">Statutory Settings</h3>
                        <div className="space-y-4 opacity-90">
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>Employee PF</span>
                                <span className="font-bold">12.00%</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>ESI Contribution</span>
                                <span className="font-bold">0.75%</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>Professional Tax</span>
                                <span className="font-bold">₹200 Fixed</span>
                            </div>
                            <div className="mt-6 p-3 bg-white/10 rounded-lg">
                                <p className="text-[10px] leading-relaxed">
                                    Statutory deductions are automatically calculated based on the gross base salary and incentives as per the active policy.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border-dashed">
                        <div className="flex items-center gap-3 text-orange-600 mb-4">
                            <AlertCircle size={20} />
                            <h4 className="font-bold text-sm">Action Items</h4>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-3">
                            <li className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 shrink-0" />
                                3 employees have unverified PF numbers.
                            </li>
                            <li className="flex gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 shrink-0" />
                                Bank details missing for Field Agent: John S.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayrollEngine;

