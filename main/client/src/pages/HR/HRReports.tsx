import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Download, Filter, Search, Calendar } from 'lucide-react';
import api from '../../services/api';

const HRReports = () => {
    const [reportType, setReportType] = useState('SALARY'); // SALARY, PF, ATTENDANCE
    const [year, setYear] = useState(2026);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const resp = await api.get(`/hr/reports/yearly?year=${year}&type=${reportType}`);
            setData(resp.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType, year]);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HR & Compliance Reports</h1>
                    <p className="text-gray-500 text-sm">Yearly consolidated salary and tax collection records</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary"><Download size={16} /> EXPORT PDF</button>
                    <button className="btn btn-primary"><Filter size={16} /> ADVANCED</button>
                </div>
            </header>

            <div className="flex gap-4 p-4 bg-white rounded-xl border shadow-sm items-center">
                <div className="flex-1 flex gap-2">
                    <button
                        onClick={() => setReportType('SALARY')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${reportType === 'SALARY' ? 'bg-sky-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        Yearly Salary Report
                    </button>
                    <button
                        onClick={() => setReportType('PF')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${reportType === 'PF' ? 'bg-sky-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        PF Collection Report
                    </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border rounded-lg">
                    <Calendar size={16} className="text-gray-400" />
                    <select className="text-sm font-bold bg-transparent outline-none" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                        <option value={2024}>FY 2024-25</option>
                        <option value={2025}>FY 2025-26</option>
                        <option value={2026}>FY 2026-27</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Registry</th>
                            {reportType === 'SALARY' ? (
                                <>
                                    <th>Base Component ($)</th>
                                    <th>Incentives Pay ($)</th>
                                    <th>Net Payout ($)</th>
                                    <th>Allocation %</th>
                                </>
                            ) : (
                                <>
                                    <th>Total PF Collected ($)</th>
                                    <th>Statutory Status</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map((item, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div className="font-bold text-gray-900">{item.firstName} {item.lastName}</div>
                                    <div className="text-[10px] text-gray-400 font-mono uppercase">{item.extId}</div>
                                </td>
                                {reportType === 'SALARY' ? (
                                    <>
                                        <td className="font-mono text-gray-600">${item.totalBase?.toLocaleString()}</td>
                                        <td className="font-mono text-sky-600">+${item.totalInc?.toLocaleString()}</td>
                                        <td className="font-mono font-bold text-gray-900">${item.totalNet?.toLocaleString()}</td>
                                        <td>
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-sky-500" style={{ width: '75%' }}></div>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="font-mono font-bold text-orange-700">${item.totalPF?.toLocaleString()}</td>
                                        <td>
                                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full text-[10px] font-bold">COMPLIANT</span>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-gray-400">
                                    <ShieldCheck size={40} className="mx-auto mb-4 opacity-10" />
                                    No financial records found for this regulatory period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500 font-medium">
                    Consolidated {reportType} Liability for FY {year}:
                    <span className="ml-2 font-bold text-gray-900">
                        ${data.reduce((acc, curr) => acc + (reportType === 'SALARY' ? curr.totalNet : curr.totalPF), 0).toLocaleString()}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button className="text-[10px] font-bold text-sky-600 hover:underline">AUDIT LOGS</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-[10px] font-bold text-sky-600 hover:underline">TAX DECLARATIONS</button>
                </div>
            </div>
        </div>
    );
};

export default HRReports;

