import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Search, Filter, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '../../services/api';

const IndividualLedger = () => {
    const { entityId } = useParams();
    const navigate = useNavigate();
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await api.get(`/finance/ledger/${entityId}`);
                setLedger(res.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        if (entityId) fetchLedger();
    }, [entityId]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    };

    if (loading) return <div className="loading-state">Accessing Account Ledger...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Entity Ledger Statement</h1>
                        <p className="text-gray-500 text-sm">Detailed transaction history for: <b>{entityId}</b></p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-secondary"><Download size={16} /> DOWNLOAD PDF</button>
                </div>
            </header>

            <div className="card bg-white p-0 overflow-hidden shadow-sm">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr className="bg-gray-50">
                                <th>DATE</th>
                                <th>DESCRIPTION</th>
                                <th>REF ID</th>
                                <th>DEBIT</th>
                                <th>CREDIT</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.length > 0 ? ledger.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="text-sm">
                                        {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="font-semibold text-gray-900">{item.description}</div>
                                        <div className="text-[10px] text-sky-500 font-bold uppercase">{item.type}</div>
                                    </td>
                                    <td className="font-mono text-[10px] text-gray-400">
                                        {item.referenceId || '--'}
                                    </td>
                                    <td className="text-red-600 font-mono font-bold">
                                        {parseFloat(item.debit) > 0 ? formatCurrency(item.debit) : '-'}
                                    </td>
                                    <td className="text-green-600 font-mono font-bold">
                                        {parseFloat(item.credit) > 0 ? formatCurrency(item.credit) : '-'}
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-gray-400">
                                        <BookOpen size={40} className="mx-auto mb-4 opacity-10" />
                                        No specific ledger entries found for this entity.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IndividualLedger;

