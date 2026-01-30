import { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Download, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import api from '../../services/api';

const GeneralLedger = () => {
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/finance/ledger');
            setLedger(resp.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const filteredLedger = ledger.filter(item =>
        item.description?.toLowerCase().includes(filter.toLowerCase()) ||
        item.type?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
                    <p className="text-gray-500 text-sm">Consolidated audit trail for all accounts</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary"><Download size={16} /> EXPORT CSV</button>
                    <button className="btn btn-primary"><Calendar size={16} /> SELECT PERIOD</button>
                </div>
            </header>

            <div className="flex gap-4 items-center bg-white p-4 rounded-xl border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search ledger by description or account type..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <select className="px-4 py-2 border rounded-lg text-sm bg-white">
                    <option value="ALL">All Accounts</option>
                    <option value="SALE">Sales Revenue</option>
                    <option value="EXPENSE">Expenses</option>
                    <option value="PURCHASE">Procurement</option>
                    <option value="RETURN">Sales Returns</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Transaction Date</th>
                            <th>Entry Details</th>
                            <th>Account Type</th>
                            <th>Debit ($)</th>
                            <th>Credit ($)</th>
                            <th>Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLedger.length > 0 ? filteredLedger.map((item) => (
                            <tr key={item.id}>
                                <td className="text-sm text-gray-500">
                                    {new Date(item.date).toLocaleDateString()}
                                    <div className="text-[10px] opacity-70">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td>
                                    <div className="font-bold text-gray-900">{item.description}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{item.id.slice(0, 8)}</div>
                                </td>
                                <td>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold uppercase">
                                        {item.type}
                                    </span>
                                </td>
                                <td className="text-red-700 font-mono font-bold">
                                    {parseFloat(item.debit) > 0 ? `-${parseFloat(item.debit).toFixed(2)}` : '-'}
                                </td>
                                <td className="text-green-700 font-mono font-bold">
                                    {parseFloat(item.credit) > 0 ? `+${parseFloat(item.credit).toFixed(2)}` : '-'}
                                </td>
                                <td>
                                    {parseFloat(item.credit) > 0 ? (
                                        <ArrowUpRight size={16} className="text-green-500" />
                                    ) : (
                                        <ArrowDownLeft size={16} className="text-red-500" />
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-20 text-gray-400">
                                    <BookOpen size={40} className="mx-auto mb-4 opacity-10" />
                                    No ledger entries found for this audit scope.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GeneralLedger;
