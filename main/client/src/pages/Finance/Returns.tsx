import React, { useState } from 'react';
import api from '../../services/api';
import { RotateCcw, Search, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SalesReturns = () => {
    const [invoiceNo, setInvoiceNo] = useState('');
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [deductions, setDeductions] = useState({ transport: 0, packaging: 0, gst: 0 });
    const [condition, setCondition] = useState('EXCELLENT');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const findSale = async () => {
        if (!invoiceNo) return;
        try {
            setLoading(true);
            setSuccess(false);
            const res = await api.get(`/sales`, { params: { invoiceNo } });
            // The search might return an array
            const foundSale = Array.isArray(res.data) ? res.data[0] : res.data;
            if (foundSale) {
                setSale(foundSale);
                setSelectedItems(foundSale.items.map((it: any) => ({ ...it, returnQty: 0 })));
            } else {
                alert('Invoice not found');
            }
        } catch (error) {
            alert('Error finding sale');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnQtyChange = (productId: string, qty: number) => {
        setSelectedItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, returnQty: Math.min(qty, item.quantity) } : item
        ));
    };

    const calculateRefund = () => {
        const total = selectedItems.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);
        return total - deductions.transport - deductions.packaging - deductions.gst;
    };

    const submitReturn = async () => {
        const itemsToReturn = selectedItems.filter(it => it.returnQty > 0);
        if (itemsToReturn.length === 0) return alert('Select items to return');

        try {
            setSubmitting(true);
            await api.post('/finance/returns', {
                saleId: sale.id,
                items: itemsToReturn.map(it => ({ productId: it.productId, quantity: it.returnQty })),
                condition,
                transportDeduction: deductions.transport,
                packagingDeduction: deductions.packaging,
                gstDeduction: deductions.gst,
                notes: `Manual return for ${invoiceNo}`
            });
            setSuccess(true);
            setSale(null);
            setInvoiceNo('');
        } catch (error) {
            alert('Failed to process return');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="section-header">
                <div className="section-title">
                    <RotateCcw size={24} className="text-primary" />
                    <div>
                        <h1>Sales Returns [RMA]</h1>
                        <p>Process customer refunds and inventory restock.</p>
                    </div>
                </div>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} />
                    <div>
                        <strong>Return Processed Successfully!</strong>
                        <p>Inventory has been updated and Daybook entry created.</p>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Search Invoice Number</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. INV-2024-001"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={findSale} disabled={loading}>
                        {loading ? 'SEARCHING...' : <><Search size={16} /> FIND SALE</>}
                    </button>
                </div>
            </div>

            {sale && (
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <div className="card no-padding">
                            <div className="card-header" style={{ borderBottom: '1px solid #eee', padding: '16px' }}>
                                <h3 style={{ margin: 0 }}>Sale Details: {sale.invoiceNo}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>Customer: {sale.customer?.name || 'Walk-in'}</p>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Orig Qty</th>
                                        <th>Price</th>
                                        <th style={{ width: '120px' }}>Return Qty</th>
                                        <th className="text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedItems.map((item) => (
                                        <tr key={item.productId}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.product?.name || 'Product'}</div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.unitPrice.toFixed(2)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={item.returnQty}
                                                    onChange={(e) => handleReturnQtyChange(item.productId, parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="text-right">₹{(item.returnQty * item.unitPrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Refund Summary</h3>
                            <div className="form-group">
                                <label className="form-label">Product Condition</label>
                                <select className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                                    <option value="EXCELLENT">Excellent (Full Resell)</option>
                                    <option value="GOOD">Good (Minor Wear)</option>
                                    <option value="DAMAGED">Damaged (Needs Repair)</option>
                                    <option value="DEFECTIVE">Defective (Scrap)</option>
                                </select>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Gross Total</span>
                                    <span>₹{selectedItems.reduce((sum, it) => sum + (it.returnQty * it.unitPrice), 0).toFixed(2)}</span>
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.75rem' }}>Transport Deduction</label>
                                    <input type="number" className="form-input" style={{ padding: '4px' }} value={deductions.transport} onChange={(e) => setDeductions(prev => ({ ...prev, transport: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.75rem' }}>Packaging Deduction</label>
                                    <input type="number" className="form-input" style={{ padding: '4px' }} value={deductions.packaging} onChange={(e) => setDeductions(prev => ({ ...prev, packaging: parseFloat(e.target.value) || 0 }))} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.75rem' }}>GST Adjustment</label>
                                    <input type="number" className="form-input" style={{ padding: '4px' }} value={deductions.gst} onChange={(e) => setDeductions(prev => ({ ...prev, gst: parseFloat(e.target.value) || 0 }))} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-500)', borderTop: '2px solid #eee', paddingTop: '12px' }}>
                                    <span>NET REFUND</span>
                                    <span>₹{calculateRefund().toFixed(2)}</span>
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={submitReturn} disabled={submitting}>
                                {submitting ? 'PROCESSING...' : 'COMPLETE RETURN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!sale && !success && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                    <Package size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>Enter an invoice number above to start a return process.</p>
                </div>
            )}
        </div>
    );
};

export default SalesReturns;
