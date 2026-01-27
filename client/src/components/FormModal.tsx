import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api, { createProduct, createSupplier, createOrder, createSale, createUser, createEmployee, createCustomer, createPayroll, createGoodsReceipt } from '../services/api';

const FormModal = ({ type, metadata, onClose, categories, suppliers, products, departments, users, customers, employees, warehouses }: any) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const productInit = { name: '', sku: '', categoryId: '', price: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 10, unit: 'pcs', leadTimeDays: 7, avgDailySales: 1.0 };
        const init = {
            products: productInit,
            inventory: productInit,
            suppliers: { name: '', email: '', contact: '', status: 'ACTIVE', paymentTerms: 'Net 30' },
            orders: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            purchases: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            payment: { title: 'Payment Processing', amount: 0, method: 'BANK_TRANSFER', type: 'PAYABLE', category: 'GENERAL', description: '' },
            sales: { items: [{ productId: '', quantity: 1, unitPrice: 0 }], customerId: '', team: 'SALES', isHomeDelivery: false, deliveryAddress: '', deliveryCity: '' },
            users: { email: '', password: '', firstName: '', lastName: '', role: 'STAFF' },
            employees: { firstName: '', lastName: '', employeeId: '', designation: '', joiningDate: new Date().toISOString().split('T')[0], salary: 0, departmentId: '', userId: '' },
            tracking_po: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED', expectedDeliveryDate: '' },
            tracking_sale: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED' },
            customers: { name: '', email: '', phone: '', address: '', city: '', zipCode: '' },
            payroll: { employeeId: metadata?.id || '', amount: metadata?.salary || 0, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'PAID', incentive: 0, overtimeAmount: 0 },
            pricing_rule: { productId: metadata?.id || '', name: 'Volume Discount', minQuantity: 10, discountPercent: 5.0 },
            grn: {
                warehouseId: warehouses?.[0]?.id || '',
                items: metadata?.items?.map((i: any) => ({
                    productId: i.productId,
                    productName: i.product?.name || 'Unknown',
                    quantity: i.quantity - (i.receivedQuantity || 0),
                    maxQty: i.quantity - (i.receivedQuantity || 0),
                    batchNumber: 'BATCH-' + Math.floor(Math.random() * 1000),
                    expiryDate: ''
                })) || [],
                notes: ''
            },
            tenant: { name: '', slug: '', planId: 'PRO' }, // Default plan
            payment_feature: {
                cardName: '',
                cardNumber: '',
                expiry: '',
                cvv: '',
                featureKey: metadata?.featureKey || '',
                featureLabel: metadata?.featureLabel || '',
                price: metadata?.price || 0
            }
        };
        setFormData((init as any)[type] || {});
    }, [type, metadata, warehouses]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (type === 'products' || type === 'inventory') await createProduct(formData);
            if (type === 'suppliers') await createSupplier(formData);
            if (type === 'orders' || type === 'purchases') await createOrder(formData);
            if (type === 'payment') await api.post('/accounts/payment', formData);
            if (type === 'sales') await createSale({ ...formData, taxAmount: 0 });
            if (type === 'users') await createUser(formData);
            if (type === 'employees') await createEmployee(formData);
            if (type === 'tracking_po') await api.patch(`/orders/${metadata.id}/tracking`, formData);
            if (type === 'tracking_sale') await api.patch(`/sales/${metadata.id}/tracking`, formData);
            if (type === 'customers') await createCustomer(formData);
            if (type === 'payroll') await createPayroll(formData);
            if (type === 'grn') await createGoodsReceipt(metadata.id, formData);
            if (type === 'tenant') await api.post('/tenants', formData);
            if (type === 'payment_feature') {
                const currentFeatures = (typeof users?.features === 'object' && users?.features !== null) ? users.features : {};
                const newFeatures = { ...currentFeatures, [formData.featureKey]: true };
                await api.put('/tenants/features', { features: newFeatures });
            }
            onClose();
        } catch (e: any) { alert("Execution Error: " + (e.response?.data?.error || e.message)); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: type === 'grn' || type === 'employees' ? '700px' : '500px' }}>
                <div className="modal-header"><span>{type.toUpperCase()} PROTOCOL</span><X onClick={onClose} style={{ cursor: 'pointer' }} /></div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

                    {(type === 'products' || type === 'inventory') && (
                        <>
                            <div className="form-group"><label>Artifact Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>SKU (ID)</label><input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required /></div>
                                <div className="form-group"><label>Stock Qty</label><input type="number" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} /></div>
                            </div>
                            <div className="form-group"><label>Category</label><select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required><option value="">Select Class</option>{categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Unit Price ($)</label><input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} step="0.01" /></div>
                                <div className="form-group"><label>Cost Basis ($)</label><input type="number" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} step="0.01" /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>UOM</label><input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, kg, box" /></div>
                                <div className="form-group"><label>Reorder Level (Safety Stock)</label><input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })} /></div>
                            </div>
                        </>
                    )}

                    {type === 'suppliers' && (
                        <>
                            <div className="form-group"><label>Vendor Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div className="form-group"><label>Corporate Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                            <div className="form-group"><label>Contact Number</label><input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} /></div>
                            <div className="form-group"><label>Payment Terms</label><input value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} placeholder="e.g. Net 30" /></div>
                        </>
                    )}

                    {type === 'customers' && (
                        <>
                            <div className="form-group"><label>Customer Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                <div className="form-group"><label>Phone</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Address</label><input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                        </>
                    )}

                    {type === 'employees' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group"><label>First Name</label><input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                            <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                            <div className="form-group"><label>Employee ID</label><input value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required /></div>
                            <div className="form-group"><label>Designation</label><input value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required /></div>
                            <div className="form-group"><label>Salary ($)</label><input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} required /></div>
                            <div className="form-group"><label>Department</label><select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required><option value="">Select Dept</option>{departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Link to User Account (Optional)</label><select value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}><option value="">No Account</option>{users?.map((u: any) => <option key={u.id} value={u.id}>{u.email}</option>)}</select></div>
                        </div>
                    )}

                    {type === 'payroll' && (
                        <>
                            <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAYING EMPLOYEE</div>
                                <div style={{ fontWeight: 700 }}>{metadata.firstName} {metadata.lastName}</div>
                            </div>

                            <div className="form-group"><label>Base Salary ($)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required /></div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Incentive/Commission ($)</label><input type="number" value={formData.incentive} onChange={e => setFormData({ ...formData, incentive: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label>Overtime Pay ($)</label><input type="number" value={formData.overtimeAmount} onChange={e => setFormData({ ...formData, overtimeAmount: parseFloat(e.target.value) || 0 })} /></div>
                            </div>

                            {/* PROJECTION SCREEN */}
                            <div style={{
                                marginTop: '10px',
                                padding: '15px',
                                background: 'rgba(5, 150, 105, 0.1)',
                                border: '1px solid var(--accent-secondary)',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 800 }}>PROJECTED PAYABLE</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                    ${((formData.amount || 0) + (formData.incentive || 0) + (formData.overtimeAmount || 0)).toFixed(2)}
                                </div>
                            </div>

                            <div className="form-group"><label>Month Period</label><input value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} /></div>
                        </>
                    )}

                    {(type === 'orders' || type === 'purchases') && (
                        <>
                            <div className="form-group"><label>Supplier</label><select value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })} required><option value="">Select Partner</option>{suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div className="table-container" style={{ maxHeight: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <label>Order Items</label>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.65rem' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }] })}>+ ITEM</button>
                                </div>
                                {formData.items?.map((item: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                        <select style={{ flex: 1 }} value={item.productId} onChange={e => { const n = [...formData.items]; n[idx].productId = e.target.value; setFormData({ ...formData, items: n }); }} required><option value="">Item</option>{products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                        <input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                        <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {type === 'sales' && (
                        <>
                            <div className="form-group"><label>Client / Customer</label><select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}><option value="">Walk-in Customer</option>{customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div className="table-container" style={{ maxHeight: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <label>Cart Items</label>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.65rem' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1 }] })}>+ ITEM</button>
                                </div>
                                {formData.items?.map((item: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                        <select style={{ flex: 1 }} value={item.productId} onChange={e => { const n = [...formData.items]; n[idx].productId = e.target.value; setFormData({ ...formData, items: n }); }} required><option value="">Product</option>{products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                        <input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                        <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input type="checkbox" checked={formData.isHomeDelivery} onChange={e => setFormData({ ...formData, isHomeDelivery: e.target.checked })} />
                                    Home Delivery Required?
                                </label>
                            </div>
                            {formData.isHomeDelivery && (
                                <>
                                    <div className="form-group"><label>Delivery Address</label><input value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} required /></div>
                                    <div className="form-group"><label>City / Zone</label><input value={formData.deliveryCity} onChange={e => setFormData({ ...formData, deliveryCity: e.target.value })} required /></div>
                                </>
                            )}
                        </>
                    )}
                    {type === 'payment' && (
                        <>
                            <div className="form-group"><label>Payment Title</label><input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Amount ($)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required /></div>
                                <div className="form-group"><label>Category</label><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}><option value="GENERAL">General</option><option value="OPERATIONAL">Operational</option><option value="SALARY">Salary</option></select></div>
                            </div>
                            <div className="form-group"><label>Flow Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="RECEIVABLE">Receivable (Credit)</option><option value="PAYABLE">Payable (Debit)</option></select></div>
                        </>
                    )}

                    {type === 'users' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>First Name</label><input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                                <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                            <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required /></div>
                            <div className="form-group"><label>System Role</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required><option value="STAFF">Staff</option><option value="SHIPMENT">Shipment</option><option value="HR">HR Manager</option><option value="MANAGEMENT">Management</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
                        </>
                    )}

                    {type === 'grn' && (
                        <>
                            <div className="form-group"><label>Target Warehouse</label><select value={formData.warehouseId} onChange={e => setFormData({ ...formData, warehouseId: e.target.value })} required><option value="">Select Warehouse</option>{warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                            <div className="table-container" style={{ maxHeight: '250px' }}>
                                <table>
                                    <thead><tr><th>Artifact</th><th>Sent</th><th>Arrived</th><th>Batch #</th><th>Expiry</th></tr></thead>
                                    <tbody>
                                        {formData.items?.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ fontSize: '0.7rem' }}>{item.productName}</td>
                                                <td>{item.maxQty}</td>
                                                <td><input type="number" style={{ width: '50px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} max={item.maxQty} /></td>
                                                <td><input type="text" style={{ width: '80px', fontSize: '0.7rem' }} value={item.batchNumber} onChange={e => { const n = [...formData.items]; n[idx].batchNumber = e.target.value; setFormData({ ...formData, items: n }); }} required /></td>
                                                <td><input type="date" style={{ width: '100px', fontSize: '0.7rem' }} value={item.expiryDate} onChange={e => { const n = [...formData.items]; n[idx].expiryDate = e.target.value; setFormData({ ...formData, items: n }); }} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {type === 'tenant' && (
                        <>
                            <div className="form-group">
                                <label>Organization Name</label>
                                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="StoreAI Retail Hub" />
                            </div>
                            <div className="form-group">
                                <label>URL Slug (Unique ID)</label>
                                <input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="retail-hub" />
                            </div>
                            <div className="form-group">
                                <label>Initial Plan</label>
                                <select value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })}>
                                    <option value="PRO">PRO ($99/mo)</option>
                                    <option value="ENTERPRISE">ENTERPRISE ($499/mo)</option>
                                </select>
                            </div>
                        </>
                    )}

                    {type === 'payment_feature' && (
                        <>
                            <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-primary)', marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.1em' }}>UPGRADE PROTOCOL</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '5px' }}>{formData.featureLabel}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '10px' }}>${formData.price}<span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/mo</span></div>
                            </div>

                            <div className="form-group">
                                <label>CARDHOLDER NAME</label>
                                <input value={formData.cardName} onChange={e => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })} required placeholder="J. DOE" />
                            </div>

                            <div className="form-group">
                                <label>CREDIT CARD NUMBER</label>
                                <input value={formData.cardNumber} onChange={e => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() })} maxLength={19} required placeholder="0000 0000 0000 0000" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>EXPIRY (MM/YY)</label>
                                    <input value={formData.expiry} onChange={e => setFormData({ ...formData, expiry: e.target.value })} required placeholder="12/26" />
                                </div>
                                <div className="form-group">
                                    <label>CVV/CVC</label>
                                    <input type="password" value={formData.cvv} onChange={e => setFormData({ ...formData, cvv: e.target.value })} maxLength={3} required placeholder="***" />
                                </div>
                            </div>

                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                                Securely processed by StoreAI Payment Gateway. <br />
                                Your subscription will begin immediately upon authorization.
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary" type="submit" style={{ padding: '14px', marginTop: '10px' }}>
                        {type === 'payment_feature' ? `AUTHORIZE $${formData.price} PAYMENT` : 'EXECUTE PROTOCOL'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default FormModal;
