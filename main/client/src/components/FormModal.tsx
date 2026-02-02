import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, FileText, Pause } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { createProduct, createSupplier, createOrder, createSale, createUser, createEmployee, createCustomer, createPayroll, createGoodsReceipt, generatePayroll } from '../services/api';

const FormModal = ({ type, metadata, onClose, categories, suppliers, products, departments, users, customers, employees, warehouses, tenants, user }: any) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F9' && type === 'sales') {
                e.preventDefault();
                handleSubmit(new Event('submit'));
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [type, formData]);

    useEffect(() => {
        const productInit = { name: '', sku: '', categoryId: '', price: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 10, unit: 'pcs', leadTimeDays: 7, avgDailySales: 1.0 };
        const init = {
            products: productInit,
            inventory: productInit,
            suppliers: { name: '', email: '', contact: '', status: 'ACTIVE', paymentTerms: 'Net 30' },
            orders: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            purchases: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            payment: { title: 'Payment Processing', amount: 0, method: 'BANK_TRANSFER', type: 'PAYABLE', category: 'GENERAL', description: '' },
            sales: { items: [{ productId: '', quantity: 1, unitPrice: 0 }], customerId: '', team: 'SALES', isHomeDelivery: false, deliveryAddress: '', deliveryCity: '', amountPaid: 0 },
            users: { email: '', password: '', firstName: '', lastName: '', roleCode: 'STAFF', tenantId: '' },
            employees: { firstName: '', lastName: '', employeeId: '', designation: '', joiningDate: new Date().toISOString().split('T')[0], salary: 0, departmentId: '', userId: '' },
            tracking_po: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED', expectedDeliveryDate: '' },
            tracking_sale: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED' },
            customers: { name: '', email: '', phone: '', address: '', city: '', zipCode: '' },
            payroll: { employeeId: metadata?.id || '', amount: metadata?.salary || 0, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'PAID', incentive: 0, overtimeAmount: 0 },
            pricing_rule: { productId: metadata?.id || '', name: 'Volume Discount', minQuantity: 10, discountPercent: 5.0 },
            requisitions: { items: metadata?.productId ? [{ productId: metadata.productId, quantity: 12 }] : [{ productId: '', quantity: 1 }], priority: 'MEDIUM', notes: '' },
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
            payment_feature: {
                cardName: '',
                cardNumber: '',
                expiry: '',
                cvv: '',
                featureKey: metadata?.featureKey || '',
                featureLabel: metadata?.featureLabel || '',
                price: metadata?.price || 0
            },
            generate_all_payroll: { month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) }
        };
        setFormData((init as any)[type] || {});
    }, [type, metadata, warehouses]);

    const generateReceipt = (sale: any) => {
        const doc = new jsPDF() as any;
        const tenant = user?.activeTenant;

        // --- 1. Header with Dual Logos ---
        // StoreAI Logo (Left)
        const storeAiLogo = "C:/Users/HP/.gemini/antigravity/brain/5c218b27-0d16-4d9e-a6b1-c18b4da4ebc8/store_ai_logo_invoice_1769579110083.png";

        // Background Accent (Top Bar)
        doc.setFillColor(79, 70, 229); // StoreAI Indigo
        doc.rect(0, 0, 210, 40, 'F');

        // StoreAI Branding
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("StoreAI", 20, 20);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("ENTERPRISE ERP PROTOCOL", 20, 26);

        // Tenant Branding (Right)
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(tenant?.name?.toUpperCase() || 'RETAIL HUB', 190, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(tenant?.slug?.toUpperCase() || 'OFFICIAL PARTNER', 190, 26, { align: 'right' });

        // --- 2. Invoice Meta ---
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(9);
        doc.text(`INVOICE NUMBER: ${sale.invoiceNo}`, 20, 50);
        doc.text(`DATE OF ISSUE: ${new Date().toLocaleString()}`, 20, 55);
        doc.text(`CURRENCY: USD ($)`, 20, 60);

        doc.text(`CUSTOMER: ${customers?.find((c: any) => c.id === formData.customerId)?.name || 'WALK-IN CUSTOMER'}`, 190, 50, { align: 'right' });
        doc.text(`PAYMENT: ${formData.paymentMethod || 'CASH'}`, 190, 55, { align: 'right' });

        // --- 3. Items Table ---
        const tableData = formData.items.map((item: any, idx: number) => {
            const p = products?.find((prod: any) => prod.id === item.productId);
            const total = item.quantity * item.unitPrice;
            const gst = total * 0.18; // Standard 18% for display
            return [idx + 1, p?.name || 'Item', item.quantity, `$${item.unitPrice.toFixed(2)}`, `$${gst.toFixed(2)}`, `$${(total + gst).toFixed(2)}`];
        });

        autoTable(doc, {
            startY: 70,
            head: [['#', 'ARTIFACT', 'QTY', 'UNIT PRICE', 'GST (18%)', 'LINE TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30 },
                5: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
            },
            margin: { left: 20, right: 20 }
        });

        // --- 4. Summary & Totals ---
        const finalY = (doc as any).lastAutoTable.finalY || 80;
        const subtotal = formData.items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
        const taxTotal = subtotal * 0.18;
        const grandTotal = subtotal + taxTotal;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("SUBTOTAL (EXCL TAX)", 140, finalY + 15);
        doc.text(`$${subtotal.toFixed(2)}`, 190, finalY + 15, { align: 'right' });

        doc.text("GST TOTAL (18%)", 140, finalY + 22);
        doc.text(`$${taxTotal.toFixed(2)}`, 190, finalY + 22, { align: 'right' });

        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(135, finalY + 26, 195, finalY + 26);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text("GRAND TOTAL", 135, finalY + 34);
        doc.text(`$${grandTotal.toFixed(2)}`, 190, finalY + 34, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(`AMOUNT PAID: $${formData.amountPaid?.toFixed(2) || grandTotal.toFixed(2)}`, 190, finalY + 41, { align: 'right' });

        // --- 5. Footer ---
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("PROTOCOL ACKNOWLEDGED: StoreAI SECURE BILLING ENGINE", 105, 285, { align: 'center' });
        doc.text("This document is an official record of your business sales.", 105, 290, { align: 'center' });

        doc.save(`Receipt_${sale.invoiceNo}.pdf`);
    };

    const parkOrder = () => {
        if (!formData.items.some((i: any) => i.productId)) return alert("Cart is empty.");
        const parked = JSON.parse(localStorage.getItem('parked_orders') || '[]');
        const label = prompt("Enter a label for this parked order (e.g., Customer Name or Table #):", `Order ${parked.length + 1}`);
        if (!label) return;

        parked.push({ ...formData, label, timestamp: new Date().toISOString() });
        localStorage.setItem('parked_orders', JSON.stringify(parked));
        alert("Order Parked Successfully. You can resume it from the Sales Dashboard.");
        onClose();
    };

    const handleSubmit = async (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            if (type === 'products' || type === 'inventory') await createProduct(formData);
            if (type === 'suppliers') await createSupplier(formData);
            if (type === 'orders' || type === 'purchases') await createOrder(formData);
            if (type === 'payment') await api.post('/accounts/payment', formData);
            if (type === 'sales') {
                const resp = await createSale(formData);
                if (resp.data) generateReceipt(resp.data);
            } else if (type === 'requisitions') {
                const { createRequisition } = await import('../services/api');
                await createRequisition(formData);
            }
            if (type === 'users') await createUser(formData);
            if (type === 'employees') await createEmployee(formData);
            if (type === 'tracking_po') await api.patch(`/orders/${metadata.id}/tracking`, formData);
            if (type === 'tracking_sale') await api.patch(`/sales/${metadata.id}/tracking`, formData);
            if (type === 'customers') await createCustomer(formData);
            if (type === 'payroll') {
                await createPayroll({
                    ...formData,
                    basicSalary: formData.amount,
                    allowances: (formData.incentive || 0) + (formData.overtimeAmount || 0),
                    grossSalary: (formData.amount || 0) + (formData.incentive || 0) + (formData.overtimeAmount || 0),
                    netSalary: (formData.amount || 0) + (formData.incentive || 0) + (formData.overtimeAmount || 0),
                });
            }
            if (type === 'grn') await createGoodsReceipt(metadata.id, formData);
            if (type === 'tenant') await api.post('/tenants', formData);
            if (type === 'payment_feature') {
                const currentFeatures = (typeof users?.features === 'object' && users?.features !== null) ? users.features : {};
                const newFeatures = { ...currentFeatures, [formData.featureKey]: true };
                await api.put('/tenants/features', { features: newFeatures });
            }
            if (type === 'generate_all_payroll') {
                await generatePayroll(formData.month);
                alert('Payroll generation initiated for all eligible employees.');
            }
            onClose();
        } catch (e: any) { alert("Execution Error: " + (e.response?.data?.error || e.message)); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`modal ${['sales', 'grn', 'employees', 'view_batches'].includes(type) ? 'modal-wide' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <span>{type.toUpperCase()} PROTOCOL</span>
                    <X onClick={onClose} style={{ cursor: 'pointer' }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', maxHeight: '65vh' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>

                            {(type === 'products' || type === 'inventory') && (
                                <>
                                    <div className="form-group"><label>Artifact Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>SKU (ID)</label><input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required /></div>
                                        <div className="form-group"><label>Stock Qty</label><input type="number" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} /></div>
                                    </div>
                                    <div className="form-group"><label>Category</label><select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required><option value="">Select Class</option>{categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>Selling Price ($)</label><input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} step="0.01" /></div>
                                        <div className="form-group"><label>Cost Basis ($)</label><input type="number" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} step="0.01" /></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>Transport ($)</label><input type="number" value={formData.transportationCost} onChange={e => setFormData({ ...formData, transportationCost: parseFloat(e.target.value) })} step="0.01" /></div>
                                        <div className="form-group"><label>GST (%)</label><input type="number" value={formData.gstRate} onChange={e => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })} step="0.1" /></div>
                                        <div className="form-group"><label>Others (%)</label><input type="number" value={formData.otherTaxRate} onChange={e => setFormData({ ...formData, otherTaxRate: parseFloat(e.target.value) })} step="0.1" /></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>UOM</label><input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, kg, box" /></div>
                                        <div className="form-group"><label>Reorder Level</label><input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })} /></div>
                                    </div>
                                </>
                            )}

                            {type === 'view_batches' && (
                                <div style={{ padding: '10px' }}>
                                    <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BATCH TRACKING FOR</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{metadata.name}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Total Stock: {metadata.stockQuantity} {metadata.unit}</div>
                                    </div>
                                    <div className="table-container" style={{ maxHeight: '300px' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>BATCH #</th>
                                                    <th>QTY</th>
                                                    <th>EXPIRY</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metadata.batches?.length > 0 ? metadata.batches.map((b: any) => (
                                                    <tr key={b.id}>
                                                        <td><code style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{b.batchNumber}</code></td>
                                                        <td><b>{b.quantityAvailable}</b></td>
                                                        <td style={{ fontSize: '0.8rem' }}>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={3} style={{ textAlign: 'center', opacity: 0.5 }}>No active batches found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {type === 'generate_all_payroll' && (
                                <>
                                    <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid var(--accent-primary)', textAlign: 'center' }}>
                                        <Building2 size={32} color="var(--accent-primary)" style={{ marginBottom: '10px' }} />
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Bulk Payroll Generation</div>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>This will calculate LOP based on attendance and generate payroll records for all employees for the selected period.</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Processing Period</label>
                                        <input value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} required />
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

                                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }}></div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>HR DETAILS</span>
                                        <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }}></div>
                                    </div>

                                    <div className="form-group"><label>Joining Date</label><input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} required /></div>
                                    <div className="form-group"><label>PAN Number</label><input value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" /></div>
                                    <div className="form-group"><label>Bank Account No</label><input value={formData.bankAccountNo} onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })} /></div>
                                    <div className="form-group"><label>Incentive %</label><input type="number" step="0.5" value={formData.incentivePercentage} onChange={e => setFormData({ ...formData, incentivePercentage: parseFloat(e.target.value) })} /></div>
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

                                    <div style={{
                                        marginTop: '10px',
                                        padding: '15px',
                                        background: 'rgba(5, 150, 105, 0.1)',
                                        border: '1px solid var(--accent-secondary)',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                    </div>

                                    <div className="form-group"><label>Month Period</label><input value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} /></div>
                                </>
                            )}

                            {type === 'requisitions' && (
                                <>
                                    <div className="form-group"><label>Priority Protocol</label><select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}><option value="LOW">LOW [STOCKING]</option><option value="MEDIUM">MEDIUM [STANDARD]</option><option value="HIGH">HIGH [CLIENT REQUEST]</option><option value="URGENT">URGENT [STOCKOUT]</option></select></div>
                                    <div className="table-container" style={{ maxHeight: '200px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                                            <label style={{ fontWeight: 800, fontSize: '0.7rem' }}>DEMAND ARTIFACTS</label>
                                            <button type="button" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.65rem' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 12 }] })}>+ ITEM</button>
                                        </div>
                                        {formData.items?.map((item: any, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: 'var(--bg-hover)', padding: '8px', borderRadius: '8px' }}>
                                                <select style={{ flex: 1, fontSize: '0.85rem' }} value={item.productId} onChange={e => {
                                                    const n = [...formData.items];
                                                    n[idx].productId = e.target.value;
                                                    setFormData({ ...formData, items: n });
                                                }} required>
                                                    <option value="">Select Item</option>
                                                    {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <input type="number" style={{ width: '80px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                                <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ color: 'var(--text-danger)', border: 'none', background: 'none' }}><X size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-group" style={{ marginTop: '10px' }}><label>Intelligence Notes</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Mention specific walk-in customer details or delivery priority..." style={{ minHeight: '80px' }} /></div>
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
                                                <select style={{ flex: 1 }} value={item.productId} onChange={e => {
                                                    const n = [...formData.items];
                                                    n[idx].productId = e.target.value;
                                                    const product = products?.find((p: any) => p.id === e.target.value);
                                                    if (product) n[idx].unitPrice = product.costPrice;
                                                    setFormData({ ...formData, items: n });
                                                }} required><option value="">Item</option>{products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                                <input type="number" step="0.01" placeholder="Price" style={{ width: '80px' }} value={item.unitPrice} onChange={e => { const n = [...formData.items]; n[idx].unitPrice = parseFloat(e.target.value); setFormData({ ...formData, items: n }); }} required />
                                                <input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                                <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {type === 'sales' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-group">
                                            <label>Client / Customer</label>
                                            <select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })}>
                                                <option value="">Walk-in Customer</option>
                                                {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Sales Advisor (Staff)</label>
                                            <select value={formData.salesmanId} onChange={e => setFormData({ ...formData, salesmanId: e.target.value })}>
                                                <option value="">No Advisor (Direct)</option>
                                                {employees?.filter((e: any) => !e.isDeleted).map((e: any) => (
                                                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="table-container" style={{ maxHeight: '300px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                                <label style={{ margin: 0, fontWeight: 800 }}>VIRTUAL CART</label>
                                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.7rem' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }] })}>+ ADD ARTIFACT</button>
                                            </div>
                                            {formData.items?.map((item: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: 'var(--bg-hover)', padding: '8px', borderRadius: '8px' }}>
                                                    <select style={{ flex: 1, fontSize: '0.85rem' }} value={item.productId} onChange={e => {
                                                        const n = [...formData.items];
                                                        n[idx].productId = e.target.value;
                                                        const product = products?.find((p: any) => p.id === e.target.value);
                                                        if (product) n[idx].unitPrice = product.price;
                                                        setFormData({ ...formData, items: n });
                                                    }} required>
                                                        <option value="">Select Item</option>
                                                        {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                                                    </select>
                                                    <input type="number" step="0.01" style={{ width: '80px' }} value={item.unitPrice} onChange={e => { const n = [...formData.items]; n[idx].unitPrice = parseFloat(e.target.value); setFormData({ ...formData, items: n }); }} required />
                                                    <input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                                    <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ color: 'var(--text-danger)', border: 'none', background: 'none' }}><X size={16} /></button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Batch Advisor & Totals Section */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ border: '1px solid var(--accent-primary)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(79, 70, 229, 0.05)' }}>
                                                <div style={{ background: 'var(--accent-primary)', color: '#fff', padding: '8px 12px', fontWeight: 800, fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>FIFO BATCH ADVISOR</span>
                                                    <span>AVAILABILITY</span>
                                                </div>
                                                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                                    {formData.items?.map((item: any, idx: number) => {
                                                        const p = products?.find((prod: any) => prod.id === item.productId);
                                                        if (!p || !p.batches || p.batches.length === 0) return null;
                                                        const bestBatch = [...p.batches].sort((a: any, b: any) => new Date(a.expiryDate || '9999').getTime() - new Date(b.expiryDate || '9999').getTime())[0];
                                                        return (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.name}</span>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.7rem' }}>{bestBatch.batchNumber}</div>
                                                                    <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>Exp: {bestBatch.expiryDate ? new Date(bestBatch.expiryDate).toLocaleDateString() : 'N/A'} | {bestBatch.quantityAvailable} left</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!formData.items || formData.items.every((i: any) => !i.productId)) && <div style={{ textAlign: 'center', opacity: 0.4, padding: '15px', fontSize: '0.8rem' }}>Please select an item...</div>}
                                                </div>
                                            </div>

                                            <div style={{ padding: '15px', background: 'var(--bg-sidebar)', borderRadius: '12px', color: '#fff', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 800 }}>ESTIMATED VALUATION</div>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-secondary)' }}>
                                                    ${formData.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                        <div className="form-group"><label>Payment Method</label>
                                            <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} required>
                                                <option value="CASH">Cash on Counter</option>
                                                <option value="CARD">Credit / Debit Card</option>
                                                <option value="UPI">UPI / Digital Wallet</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Amount Paid ($)</label>
                                            <input type="number" step="0.01" value={formData.amountPaid} onChange={e => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>

                                    {formData.paymentMethod === 'CARD' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                                            <div className="form-group"><label>Card Number</label><input placeholder="XXXX XXXX XXXX XXXX" /></div>
                                            <div className="form-group"><label>CVV</label><input placeholder="***" type="password" /></div>
                                        </div>
                                    )}

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
                                    <div style={{ display: 'grid', gridTemplateColumns: user?.activeTenant?.slug === 'storeai' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                                        <div className="form-group">
                                            <label>System Role</label>
                                            <select value={formData.roleCode} onChange={e => setFormData({ ...formData, roleCode: e.target.value })} required>
                                                <option value="STAFF">Staff</option>
                                                <option value="SHIPMENT">Shipment Officer</option>
                                                <option value="HR">HR Manager</option>
                                                <option value="MANAGEMENT">Management</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        {user?.activeTenant?.slug === 'storeai' && (
                                            <div className="form-group">
                                                <label>Organization Mapping</label>
                                                <select value={formData.tenantId} onChange={e => setFormData({ ...formData, tenantId: e.target.value })} required>
                                                    <option value="">Select Tenant</option>
                                                    {tenants?.map((t: any) => (
                                                        <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
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
                                        <label>Branding Logo</label>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)' }}>
                                                {formData.logo ? <img src={formData.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={16} opacity={0.3} />}
                                            </div>
                                            <input type="file" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
                                                    reader.readAsDataURL(file);
                                                }
                                            }} style={{ fontSize: '0.7rem' }} />
                                        </div>
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
                                    <div style={{ background: 'rgba(129, 140, 241, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid var(--accent-primary)', marginBottom: '10px' }}>
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

                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: type === 'sales' ? '1fr 2fr' : '1fr', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        {type === 'sales' && (
                            <button className="btn btn-secondary" type="button" onClick={parkOrder} style={{ padding: '14px', height: '54px' }}>
                                <Pause size={18} /> PARK
                            </button>
                        )}
                        <button className="btn btn-primary" type="submit" style={{ padding: '14px', fontWeight: 900, height: '54px', fontSize: '1rem' }}>
                            {type === 'payment_feature' ? `AUTHORIZE $${formData.price}` : (type === 'sales' ? 'EXECUTE & PRINT [F9]' : 'EXECUTE PROTOCOL')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default FormModal;
