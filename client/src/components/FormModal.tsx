import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api, { createProduct, createSupplier, createOrder, createSale, createUser, createEmployee, createCustomer, createPayroll, createGoodsReceipt } from '../services/api';

const FormModal = ({ type, metadata, onClose, categories, suppliers, products, departments, users, customers, employees, warehouses }: any) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const init = {
            products: { name: '', sku: '', categoryId: '', price: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 10, leadTimeDays: 7, avgDailySales: 1.0 },
            suppliers: { name: '', email: '' },
            orders: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            payment: { amount: 0, method: 'CASH', type: 'RECEIVABLE', transactionId: '' },
            sales: { items: [{ productId: '', quantity: 1, unitPrice: 0 }], customerId: '', team: 'SALES', isHomeDelivery: false, deliveryAddress: '', deliveryCity: '' },
            users: { email: '', password: '', firstName: '', lastName: '', role: 'STAFF' },
            employees: { employeeId: '', designation: '', joiningDate: new Date().toISOString().split('T')[0], salary: 0, incentivePercentage: 0, departmentId: '', userId: '' },
            tracking_po: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED', expectedDeliveryDate: '' },
            tracking_sale: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED' },
            customers: { name: '', email: '', phone: '', address: '', city: '', zipCode: '' },
            payroll: { employeeId: metadata?.id || '', amount: metadata?.salary || 0, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'PAID', monthlySales: 0, overtimeHours: 0 },
            pricing_rule: { productId: metadata?.id || '', name: 'Volume Discount', minQuantity: 10, discountPercent: 5.0 },
            document_receipt: { type: 'RECEIPT', sourceWarehouseId: warehouses?.[0]?.id, items: [{ productId: '', quantity: 0 }], notes: '' },
            document_transfer: { type: 'TRANSFER', sourceWarehouseId: warehouses?.[0]?.id, targetWarehouseId: '', items: [{ productId: '', quantity: 0 }], notes: '' },
            deals: { title: 'New Deal', value: 0, customerId: '', items: [{ productId: '', quantity: 1, price: 0 }] },
            // GRN: Pre-fill items from the PO metadata
            grn: {
                warehouseId: warehouses?.[0]?.id || '',
                items: metadata?.items?.map((i: any) => ({
                    productId: i.productId,
                    productName: i.product?.name || 'Unknown',
                    quantity: i.quantity - (i.receivedQuantity || 0), // Default to remaining qty
                    maxQty: i.quantity - (i.receivedQuantity || 0),
                    batchNumber: '',
                    expiryDate: ''
                })) || [],
                notes: ''
            }
        };
        // Safe access
        setFormData((init as any)[type] || {});
    }, [type, metadata, warehouses]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (type === 'products') await createProduct(formData);
            if (type === 'suppliers') await createSupplier(formData);
            if (type === 'orders') await createOrder(formData);
            if (type === 'payment') await api.post('/accounts/payment', formData);
            if (type === 'sales') await createSale({ ...formData, taxAmount: 0 });
            if (type === 'users') await createUser(formData);
            if (type === 'employees') await createEmployee(formData);
            if (type === 'tracking_po') await api.patch(`/orders/${metadata.id}/tracking`, formData);
            if (type === 'tracking_sale') await api.patch(`/sales/${metadata.id}/tracking`, formData);
            if (type === 'customers') await createCustomer(formData);
            if (type === 'payroll') await createPayroll(formData);
            if (type === 'deals') await api.post('/crm', formData);
            if (type === 'grn') await createGoodsReceipt(metadata.id, formData);
            onClose();
        } catch (e: any) { alert("Execution Error: " + (e.response?.data?.error || e.message)); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: type === 'grn' ? '800px' : (type === 'hr' ? '600px' : '500px') }}>
                <div className="modal-header"><span>{type.toUpperCase()} PROTOCOL</span><X onClick={onClose} style={{ cursor: 'pointer' }} /></div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

                    {type === 'products' && (
                        <>
                            <div className="form-group"><label>Artifact Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>SKU (ID)</label><input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required /></div>
                                <div className="form-group"><label>Stock Qty</label><input type="number" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} /></div>
                            </div>
                            <div className="form-group"><label>Category</label><select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}><option value="">Select Class</option>{categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Unit Price ($)</label><input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} step="0.01" /></div>
                                <div className="form-group"><label>Cost Basis ($)</label><input type="number" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} step="0.01" /></div>
                            </div>
                        </>
                    )}

                    {type === 'orders' && (
                        <>
                            <div className="form-group"><label>Partner Node</label><select value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })} required><option value="">Select Partner</option>{suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            {formData.items?.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '5px' }}>
                                    <select value={item.productId} onChange={e => { const n = [...formData.items]; n[idx].productId = e.target.value; setFormData({ ...formData, items: n }); }} required><option value="">Select Artifact</option>{products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                    <input type="number" value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} placeholder="Qty" />
                                </div>
                            ))}
                        </>
                    )}

                    {type === 'grn' && (
                        <>
                            <div className="form-group"><label>Target Warehouse</label><select value={formData.warehouseId} onChange={e => setFormData({ ...formData, warehouseId: e.target.value })} required><option value="">Select Warehouse</option>{warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                            <div className="table-container" style={{ maxHeight: '200px' }}>
                                <table>
                                    <thead><tr><th>Artifact</th><th>Expected</th><th>Received</th><th>Batch #</th><th>Expiry</th></tr></thead>
                                    <tbody>
                                        {formData.items?.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td>{item.productName}</td>
                                                <td>{item.maxQty}</td>
                                                <td><input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} max={item.maxQty} /></td>
                                                <td><input type="text" style={{ width: '80px' }} placeholder="BATCH-001" value={item.batchNumber} onChange={e => { const n = [...formData.items]; n[idx].batchNumber = e.target.value; setFormData({ ...formData, items: n }); }} required /></td>
                                                <td><input type="date" style={{ width: '100px' }} value={item.expiryDate} onChange={e => { const n = [...formData.items]; n[idx].expiryDate = e.target.value; setFormData({ ...formData, items: n }); }} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary" type="submit">EXECUTE PROTOCOL</button>
                </form>
            </motion.div>
        </div>
    );
};

export default FormModal;
