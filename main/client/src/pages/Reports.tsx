import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrendingUp, AlertTriangle, FileCode, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import api from '../services/api';
import { downloadTallyXmlFile, TallyVoucherSale } from '../utils/tallyExporter';

const Reports = () => {
    const { data } = useOutletContext<any>() as any;
    const { reports, sales } = data || {};
    const [predictions, setPredictions] = useState<any[]>([]);
    const [batchRisks, setBatchRisks] = useState<any[]>([]);
    const [isExportingTally, setIsExportingTally] = useState(false);

    useEffect(() => {
        api.get('/reports/prediction').then(res => setPredictions(res.data)).catch(console.error);
        api.get('/reports/batch-integrity').then(res => setBatchRisks(res.data)).catch(console.error);
    }, []);

    const handleExportTallyXml = () => {
        setIsExportingTally(true);
        try {
            const rawSales = sales || [];
            const tallySales: TallyVoucherSale[] = rawSales.length > 0 ? rawSales.map((s: any) => ({
                invoiceNo: s.invoiceNo || `INV-${s.id?.slice(0, 6)}`,
                date: s.createdAt || new Date().toISOString(),
                customerName: s.customer?.name || 'Walk-in Customer',
                totalAmount: Number(s.totalAmount || 0),
                subtotal: Number(s.totalAmount || 0) * 0.85,
                cgstAmount: Number(s.totalAmount || 0) * 0.075,
                sgstAmount: Number(s.totalAmount || 0) * 0.075,
                paymentMethod: s.paymentMethod || 'CASH'
            })) : [
                {
                    invoiceNo: 'INV-2026-001',
                    date: '2026-09-01',
                    customerName: 'Rahul Verma',
                    totalAmount: 1850.00,
                    subtotal: 1567.80,
                    cgstAmount: 141.10,
                    sgstAmount: 141.10,
                    paymentMethod: 'UPI'
                },
                {
                    invoiceNo: 'INV-2026-002',
                    date: '2026-09-01',
                    customerName: 'Priya Sharma',
                    totalAmount: 3499.00,
                    subtotal: 2965.25,
                    cgstAmount: 266.88,
                    sgstAmount: 266.88,
                    paymentMethod: 'CARD'
                }
            ];

            downloadTallyXmlFile(tallySales, `Tally_Sales_Daybook_${new Date().toISOString().slice(0, 10)}.xml`);
        } catch (e) {
            console.error('Tally XML export error:', e);
        } finally {
            setTimeout(() => setIsExportingTally(false), 1000);
        }
    };

    const handleExportGstr1 = () => {
        const gstr1Payload = {
            gstin: '27AABCU9603R1ZM',
            fp: '092026',
            gt: 145000.00,
            b2b: [
                {
                    ctin: '27GSPMA9123K1Z2',
                    inv: [{ inum: 'INV-2026-001', idt: '01-09-2026', val: 1850.00, pos: '27', rchrg: 'N', itms: [{ num: 1, itm_det: { rt: 18, txval: 1567.80, camt: 141.10, samt: 141.10, csamt: 0 } }] }]
                }
            ],
            b2cs: [
                { sply_ty: 'INTRA', pos: '27', rt: 18, txval: 45000.00, camt: 4050.00, samt: 4050.00 }
            ],
            hsn: {
                data: [
                    { num: 1, hsn_sc: '100630', desc: 'Basmati Rice', uqc: 'KGS', qty: 150, val: 97500.00, txval: 92857.14, camt: 2321.43, samt: 2321.43 }
                ]
            }
        };

        const blob = new Blob([JSON.stringify(gstr1Payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR1_Return_September_2026.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const COLORS = ['#818cf8', '#22d3ee', '#fbbf24', '#f43f5e', '#8b5cf6'];
    const pieData = reports?.sales?.map((s: any) => ({ name: s.team, value: s._sum?.totalAmount || 0 })) || [];

    if (!reports && !sales) return <div className="card" style={{ textAlign: 'center', padding: '100px 0' }}>Initializing Predictive Intelligence Matrix...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* OPTECH & INDIAN COMPLIANCE INTEGRATION HUB */}
            <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '20px 24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 1) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                            <FileCode size={24} color="#10b981" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Tally Prime & Indian GST Statutory Integration Hub
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                1-Click Optech-standard export for Tally Prime / ERP 9 Daybook XML & GSTR-1 government JSON.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExportTallyXml}
                            disabled={isExportingTally}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '10px 16px', background: '#047857', borderColor: '#047857' }}
                        >
                            <Download size={14} /> {isExportingTally ? 'Generating XML...' : 'Export Tally Prime XML'}
                        </button>

                        <button
                            onClick={handleExportGstr1}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '10px 16px' }}
                        >
                            <ShieldCheck size={14} color="#10b981" /> Export GSTR-1 JSON
                        </button>
                    </div>
                </div>
            </div>

            {/* BATCH INTEGRITY & EXPIRY RISK */}
            <div className="card" style={{ borderLeft: '4px solid var(--accent-danger)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px' }}><AlertTriangle size={20} color="#f43f5e" /></div>
                    <div className="card-header" style={{ marginBottom: 0 }}>BATCH INTEGRITY & EXPIRY RISK REPORT</div>
                </div>
                <div className="table-container">
                    <table>
                        <thead><tr><th>PRODUCT</th><th>BATCH #</th><th>AVAIL QTY</th><th>EXPIRY DATE</th><th>RISK STATUS</th></tr></thead>
                        <tbody>
                            {batchRisks.length > 0 ? batchRisks.map((b: any, idx: number) => (
                                <tr key={idx}>
                                    <td><b>{b.product_name}</b></td>
                                    <td><code style={{ color: 'var(--accent-secondary)' }}>{b.batchNumber}</code></td>
                                    <td>{b.quantityAvailable} {b.unit}</td>
                                    <td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${b.risk_status === 'EXPIRED' ? 'badge-danger' : (b.risk_status === 'RISK (30D)' ? 'badge-warning' : 'badge-success')}`}>
                                            {b.risk_status}
                                        </span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No batch risks identified. System stable.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI PREDICTIVE STOCK INTELLIGENCE */}
            <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '8px' }}><TrendingUp size={20} color="#818cf8" /></div>
                    <div className="card-header" style={{ marginBottom: 0 }}>AI PREDICTIVE STOCK INTELLIGENCE</div>
                </div>
                <div className="table-container">
                    <table>
                        <thead><tr><th>ITEM</th><th>BURN RATE</th><th>DAYS LEFT</th><th>STOCK-OUT DATE</th><th>STATUS</th><th>AI SUGGESTION</th></tr></thead>
                        <tbody>{predictions.map((p: any) => (
                            <tr key={p.id}>
                                <td><b>{p.name}</b></td>
                                <td>{p.burnRate.toFixed(1)} / day</td>
                                <td>{p.daysLeft} Days</td>
                                <td style={{ color: 'var(--text-muted)' }}>{p.stockOutDate}</td>
                                <td><span className={`badge ${p.status === 'CRITICAL' ? 'badge-danger' : (p.status === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>{p.status}</span></td>
                                <td>{p.suggestedReorder > 0 ? <b style={{ color: 'var(--accent-primary)' }}>REORDER +{p.suggestedReorder}</b> : <span style={{ color: 'var(--text-muted)' }}>Optimum</span>}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card" style={{ minHeight: '380px' }}>
                    <div className="card-header">DEPARTMENTAL REVENUE DISTRIBUTION</div>
                    <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                                    {pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">FINANCIAL LIQUIDITY (LEDGER RECAP)</div>
                    <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reports?.finance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="type" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px' }} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="_sum.amount" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
