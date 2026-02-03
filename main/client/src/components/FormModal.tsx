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
            sales: { items: [{ productId: '', quantity: 1, unitPrice: 0 }], customerId: '', team: 'SALES', isHomeDelivery: false, deliveryAddress: '', deliveryCity: '', amountPaid: 0, paymentMethod: 'CASH' },
            users: { email: '', password: '', firstName: '', lastName: '', roleCode: 'STAFF', tenantId: '' },
            employees: { firstName: '', lastName: '', employeeId: '', designation: '', joiningDate: new Date().toISOString().split('T')[0], salary: 0, departmentId: '', userId: '', aadhaarNumber: '', panNumber: '' },
            tracking_po: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED', expectedDeliveryDate: '' },
            tracking_sale: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED' },
            customers: { name: '', email: '', phone: '', address: '', city: '', state: '', gstNumber: '' },
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

    const getModalTitle = () => {
        const mapping: Record<string, string> = {
            products: 'PRODUCT MASTER',
            inventory: 'STOCK ADJUSTMENT',
            suppliers: 'VENDOR ONBOARDING',
            orders: 'PURCHASE ORDER [PO]',
            purchases: 'PROCUREMENT LOG',
            payment: 'BILLINGS & PAYMENTS',
            sales: 'SALES [GST INVOICE]',
            users: 'ACCESS PROTOCOL',
            employees: 'HR ONBOARDING',
            customers: 'CUSTOMER MASTER',
            payroll: 'PAYROLL EXECUTION',
            tracking_po: 'INBOUND TRACKING',
            tracking_sale: 'DELIVERY LOGISTICS',
            grn: 'GOODS RECEIPT [GRN]',
            help: 'SYSTEM DOCUMENTATION',
            view_batches: 'STOCK BATCH ANALYSIS'
        };
        return mapping[type] || 'PROTOCOL ENTRY';
    };

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
        doc.text(`CURRENCY: ₹ (INR)`, 20, 60);

        doc.text(`CUSTOMER: ${customers?.find((c: any) => c.id === formData.customerId)?.name || 'WALK-IN CUSTOMER'}`, 190, 50, { align: 'right' });
        doc.text(`PAYMENT: ${formData.paymentMethod || 'CASH'}`, 190, 55, { align: 'right' });

        // --- 3. Items Table ---
        const tableData = formData.items.map((item: any, idx: number) => {
            const p = products?.find((prod: any) => prod.id === item.productId);
            const total = item.quantity * item.unitPrice;
            const gst = total * 0.18; // Standard 18% for display
            return [idx + 1, p?.name || 'Stock Item', item.quantity, `₹${item.unitPrice.toFixed(2)}`, `₹${gst.toFixed(2)}`, `₹${(total + gst).toFixed(2)}`];
        });

        autoTable(doc, {
            startY: 70,
            head: [['#', 'ITEM / PRODUCT', 'QTY', 'UNIT PRICE', 'GST (18%)', 'LINE TOTAL']],
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
        doc.text(`₹${subtotal.toFixed(2)}`, 190, finalY + 15, { align: 'right' });

        doc.text("GST TOTAL (18%)", 140, finalY + 22);
        doc.text(`₹${taxTotal.toFixed(2)}`, 190, finalY + 22, { align: 'right' });

        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(135, finalY + 26, 195, finalY + 26);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text("GRAND TOTAL", 135, finalY + 34);
        doc.text(`₹${grandTotal.toFixed(2)}`, 190, finalY + 34, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(`AMOUNT PAID: ₹${formData.amountPaid?.toFixed(2) || grandTotal.toFixed(2)}`, 190, finalY + 41, { align: 'right' });

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
        <div className="modal-overlay" onClick={onClose} >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`modal ${['sales', 'grn', 'employees', 'view_batches'].includes(type) ? 'modal-wide' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <span>{getModalTitle()}</span>
                    <X onClick={onClose} style={{ cursor: 'pointer' }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', maxHeight: '65vh' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>

                            {(type === 'products' || type === 'inventory') && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group"><label>PRODUCT NAME</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                                    <div className="form-group"><label>SKU / HSN CODE</label><input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required /></div>
                                    <div className="form-group"><label>CATEGORY</label>
                                        <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                                            <option value="">Select Category</option>
                                            {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>SALES PRICE (₹)</label><input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} required /></div>
                                    <div className="form-group"><label>COST PRICE (₹)</label><input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} required /></div>
                                    <div className="form-group"><label>INITIAL STOCK</label><input type="number" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', gridColumn: 'span 2' }}>
                                        <div className="form-group"><label>TRANSPORT (₹)</label><input type="number" value={formData.transportationCost} onChange={e => setFormData({ ...formData, transportationCost: parseFloat(e.target.value) })} step="0.01" /></div>
                                        <div className="form-group"><label>GST (%)</label><input type="number" value={formData.gstRate} onChange={e => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })} step="0.1" /></div>
                                        <div className="form-group"><label>OTHERS (%)</label><input type="number" value={formData.otherTaxRate} onChange={e => setFormData({ ...formData, otherTaxRate: parseFloat(e.target.value) })} step="0.1" /></div>
                                    </div>
                                    <div className="form-group"><label>UOM / UNIT</label><input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, nos, kg" /></div>
                                    <div className="form-group"><label>REORDER LEVEL</label><input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) })} /></div>
                                </div>
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
                                    <div className="form-group"><label>Customer / Client Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>Contact Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                        <div className="form-group"><label>Mobile Number</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                    </div>
                                    <div className="form-group"><label>GST NUMBER (IF ANY)</label><input value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" /></div>
                                    <div className="form-group"><label>Full Address</label><input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                                </>
                            )}

                            {type === 'employees' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group"><label>First Name</label><input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                                    <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                                    <div className="form-group"><label>Employee ID / Aadhaar</label><input value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required /></div>
                                    <div className="form-group"><label>Designation</label><input value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required /></div>
                                    <div className="form-group"><label>Monthly Salary (INR)</label><input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} required /></div>
                                    <div className="form-group"><label>Department</label><select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required><option value="">Select Dept</option>{departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Link to System Account (Optional)</label><select value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}><option value="">No Account</option>{users?.map((u: any) => <option key={u.id} value={u.id}>{u.email}</option>)}</select></div>

                                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }}></div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>HR DETAILS</span>
                                        <div style={{ height: '1px', background: 'var(--border-color)', flex: 1 }}></div>
                                    </div>

                                    <div className="form-group"><label>Joining Date</label><input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} required /></div>
                                    <div className="form-group"><label>PAN Card Number</label><input value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" /></div>
                                    <div className="form-group"><label>Bank Account Number</label><input value={formData.bankAccountNo} onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })} /></div>
                                    <div className="form-group"><label>Performance Incentive %</label><input type="number" step="0.5" value={formData.incentivePercentage} onChange={e => setFormData({ ...formData, incentivePercentage: parseFloat(e.target.value) })} /></div>
                                </div>
                            )}

                            {type === 'payroll' && (
                                <>
                                    <div style={{ background: 'var(--bg-hover)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAYING EMPLOYEE</div>
                                        <div style={{ fontWeight: 700 }}>{metadata.firstName} {metadata.lastName}</div>
                                    </div>

                                    <div className="form-group"><label>Base Salary (₹)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required /></div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>Incentive/Commission (₹)</label><input type="number" value={formData.incentive} onChange={e => setFormData({ ...formData, incentive: parseFloat(e.target.value) || 0 })} /></div>
                                        <div className="form-group"><label>Overtime Pay (₹)</label><input type="number" value={formData.overtimeAmount} onChange={e => setFormData({ ...formData, overtimeAmount: parseFloat(e.target.value) || 0 })} /></div>
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
                                            <label style={{ fontWeight: 800, fontSize: '0.7rem' }}>STOCK ITEMS</label>
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
                                                }} required><option value="">Select Item</option>{products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} [₹{p.price}]</option>)}</select>
                                                <input type="number" step="0.01" placeholder="Price (₹)" style={{ width: '80px' }} value={item.unitPrice} onChange={e => { const n = [...formData.items]; n[idx].unitPrice = parseFloat(e.target.value); setFormData({ ...formData, items: n }); }} required />
                                                <input type="number" style={{ width: '60px' }} value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} min="1" />
                                                <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {type === 'sales' && (
                                <div className="pos-container">
                                    {/* Left: Cart & Items */}
                                    <div className="pos-cart-section">
                                        <div className="pos-cart-header">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>VIRTUAL CART</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>ACTIVE SESSION</span>
                                            </div>
                                            <button type="button" className="btn btn-primary" style={{ padding: '6px 14px' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }] })}>
                                                + ADD ITEM
                                            </button>
                                        </div>

                                        <div className="pos-cart-list no-scrollbar">
                                            {formData.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="pos-cart-item">
                                                    <select
                                                        style={{ border: 'none', background: 'transparent', fontWeight: 700 }}
                                                        value={item.productId}
                                                        onChange={e => {
                                                            const n = [...formData.items];
                                                            n[idx].productId = e.target.value;
                                                            const product = products?.find((p: any) => p.id === e.target.value);
                                                            if (product) n[idx].unitPrice = product.price;
                                                            setFormData({ ...formData, items: n });
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Search Item...</option>
                                                        {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} [₹{p.price}]</option>)}
                                                    </select>
                                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0 8px' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '4px' }}>₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: 600 }}
                                                            value={item.unitPrice}
                                                            onChange={e => { const n = [...formData.items]; n[idx].unitPrice = parseFloat(e.target.value); setFormData({ ...formData, items: n }); }}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0 8px' }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginRight: '4px' }}>QTY</span>
                                                        <input
                                                            type="number"
                                                            style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: 700, textAlign: 'center' }}
                                                            value={item.quantity}
                                                            onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }}
                                                            min="1"
                                                        />
                                                    </div>
                                                    <button type="button" onClick={() => { const n = [...formData.items]; n.splice(idx, 1); setFormData({ ...formData, items: n }); }} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!formData.items || formData.items.length === 0) && (
                                                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>
                                                    <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🛒</div>
                                                    <div style={{ fontSize: '0.8rem' }}>Cart is empty. Start adding items.</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pos-hotkey-bar">
                                            <span><span className="pos-hotkey">F2</span> NEW</span>
                                            <span><span className="pos-hotkey">F9</span> INVOICE</span>
                                            <span><span className="pos-hotkey">ESC</span> EXIT</span>
                                        </div>
                                    </div>

                                    {/* Right: Customer & Checkout */}
                                    <div className="pos-summary-section">
                                        <div className="card" style={{ padding: '15px' }}>
                                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800 }}>CLIENT / CUSTOMER</label>
                                                <select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} style={{ borderRadius: '12px' }}>
                                                    <option value="">Walk-in Customer</option>
                                                    {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '0' }}>
                                                <label style={{ fontSize: '0.65rem', fontWeight: 800 }}>SALES ADVISOR</label>
                                                <select value={formData.salesmanId} onChange={e => setFormData({ ...formData, salesmanId: e.target.value })} style={{ borderRadius: '12px' }}>
                                                    <option value="">Direct Entry</option>
                                                    {employees?.filter((e: any) => !e.isDeleted).map((e: any) => (
                                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pos-batch-advisor">
                                            <div className="pos-batch-header">⚡ FIFO BATCH ADVISOR</div>
                                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }} className="no-scrollbar">
                                                {formData.items?.map((item: any, idx: number) => {
                                                    const p = products?.find((prod: any) => prod.id === item.productId);
                                                    if (!p || !p.batches || p.batches.length === 0) return null;
                                                    const bestBatch = [...p.batches].sort((a: any, b: any) => new Date(a.expiryDate || '9999').getTime() - new Date(b.expiryDate || '9999').getTime())[0];
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.name}</span>
                                                                <span style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 800 }}>{bestBatch.batchNumber}</span>
                                                            </div>
                                                            <div style={{ textAlign: 'right', fontSize: '0.65rem' }}>
                                                                <div style={{ fontWeight: 800 }}>{bestBatch.quantityAvailable} AVAIL</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(!formData.items || formData.items.every((i: any) => !i.productId)) && <div style={{ textAlign: 'center', opacity: 0.4, padding: '10px', fontSize: '0.7rem' }}>Select item to see batch intelligence...</div>}
                                            </div>
                                        </div>

                                        <div className="pos-checkout-card">
                                            <span className="pos-total-label">BILLING TOTAL (INC. GST)</span>
                                            <div className="pos-total-value">
                                                ₹{formData.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0).toFixed(2)}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', width: '100%', marginTop: '5px' }}>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Net: ₹{(formData.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0) / 1.18).toFixed(2)}</span>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.7, color: '#fbbf24' }}>GST (18%): ₹{(formData.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0) - (formData.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0) / 1.18)).toFixed(2)}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '15px 0' }}></div>
                                            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>METHOD</span>
                                                    <select
                                                        className="pos-checkout-select"
                                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: 0, width: '100%' }}
                                                        value={formData.paymentMethod}
                                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                    >
                                                        <option value="CASH">CASH</option>
                                                        <option value="CARD">CARD</option>
                                                        <option value="UPI">UPI</option>
                                                    </select>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>PAYING</span>
                                                    <input
                                                        type="number"
                                                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: 0, textAlign: 'right', width: '100%' }}
                                                        value={formData.amountPaid}
                                                        onChange={e => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, isHomeDelivery: !formData.isHomeDelivery })}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Dispatch for Home Delivery?</span>
                                            <input type="checkbox" checked={formData.isHomeDelivery} onChange={e => setFormData({ ...formData, isHomeDelivery: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                                        </div>
                                        {formData.isHomeDelivery && (
                                            <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <input placeholder="Delivery Address" value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} style={{ fontSize: '0.8rem' }} />
                                                <input placeholder="City / Zone" value={formData.deliveryCity} onChange={e => setFormData({ ...formData, deliveryCity: e.target.value })} style={{ fontSize: '0.8rem' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {type === 'payment' && (
                                <>
                                    <div className="form-group"><label>Payment Title</label><input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div className="form-group"><label>Amount (₹)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required /></div>
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
                                            <thead><tr><th>Product / Item</th><th>Sent</th><th>Arrived</th><th>Batch #</th><th>Expiry</th></tr></thead>
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

                            {type === 'help' && (
                                <div style={{ padding: '10px' }}>
                                    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: '5px' }}>STOREAI SYSTEM GUIDE</h2>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Master the platform workflows and optimize your operations.</p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        {/* Row 1: Procurement */}
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <div style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>1</div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>PROCUREMENT & STOCK INBOUND</h3>
                                            </div>
                                            <div style={{ marginLeft: '34px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                                    <li style={{ marginBottom: '8px' }}>🚀 <b>Step A:</b> Create a <b>Supplier</b> in Partners section if not already present.</li>
                                                    <li style={{ marginBottom: '8px' }}>📝 <b>Step B:</b> Post a <b>Purchase Order (PO)</b> via Procurement Hub including required item stock levels.</li>
                                                    <li style={{ marginBottom: '8px' }}>✅ <b>Step C:</b> Once goods arrive, the <b>Procurement Team</b> (e.g. James Wilson) verifies shipment.</li>
                                                    <li style={{ marginBottom: '8px' }}>📦 <b>Step D:</b> Click <b>GENERATE GRN</b> on the PO. This updates <b>Stock Master</b> and creates a trackable <b>Batch</b>.</li>
                                                </ul>
                                            </div>
                                        </section>

                                        {/* Row 2: Sales */}
                                        <section>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <div style={{ background: '#10b981', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>2</div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>SALES & POS EXECUTION</h3>
                                            </div>
                                            <div style={{ marginLeft: '34px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                                    <li style={{ marginBottom: '8px' }}>🛒 <b>Step A:</b> Open <b>Sales [POS]</b> and add items to the Virtual Cart.</li>
                                                    <li style={{ marginBottom: '8px' }}>🧠 <b>Step B:</b> Use <b>FIFO Batch Advisor</b> (on the right) to identify which batch to sell first based on expiry.</li>
                                                    <li style={{ marginBottom: '8px' }}>🖨️ <b>Step C:</b> Press <b>F9</b> or Execute to finalize. System generates a professional <b>PDF Invoice</b> automatically.</li>
                                                </ul>
                                            </div>
                                        </section>

                                        {/* Row 3: Admin */}
                                        {user?.role === 'SUPER_ADMIN' && (
                                            <section>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                    <div style={{ background: '#6366f1', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>3</div>
                                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>SUPER ADMIN PLATFORM CONTROL</h3>
                                                </div>
                                                <div style={{ marginLeft: '34px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                                        <li style={{ marginBottom: '8px' }}>🌍 <b>Global View:</b> Use <b>Global Stock Master</b> to audit inventory across all 29+ tenants simultaneously.</li>
                                                        <li style={{ marginBottom: '8px' }}>🔍 <b>Audit Logs:</b> Monitor platform-wide behavior in the Audit Trail section.</li>
                                                    </ul>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '30px', padding: '15px', background: 'var(--bg-hover)', borderRadius: '12px', fontSize: '0.75rem', textAlign: 'center', opacity: 0.8 }}>
                                        Need Technical Support? Contact <b>support@storeai.com</b> or use the <b>AI Intelligence</b> assistant for real-time analysis.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: type === 'sales' ? '1fr 2fr' : '1fr', gap: '15px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        {type === 'sales' && (
                            <button className="btn btn-secondary" type="button" onClick={parkOrder} style={{ padding: '14px', height: '54px' }}>
                                <Pause size={18} /> PARK
                            </button>
                        )}
                        <button className="btn btn-primary" type={type === 'help' ? 'button' : 'submit'} onClick={type === 'help' ? onClose : undefined} style={{ padding: '14px', fontWeight: 900, height: '54px', fontSize: '1rem' }}>
                            {type === 'help' ? 'DISMISS GUIDE' : (type === 'payment_feature' ? `AUTHORIZE ₹${formData.price}` : (type === 'sales' ? 'PRINT GST INVOICE [F9]' : 'CONFIRM TRANSACTION'))}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div >
    );
};

export default FormModal;
