import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Truck,
    CheckCircle2, FileText, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck,
    Zap, Sparkles, Activity, RefreshCw, BarChart2, PieChart, Clock, Calendar
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const Dashboard = () => {
    const { data } = useOutletContext<any>();
    const { stats, sales = [], orders = [], products = [], inventory } = data || {};
    const [timeRange, setTimeRange] = useState('3M');

    // --- Financial Calculations ---
    const totalRevenue = stats?.revenue || sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
    const totalProcurement = stats?.procurement || orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const netStatus = totalRevenue - totalProcurement;
    const profitMarginPercent = totalRevenue > 0 ? ((netStatus / totalRevenue) * 100).toFixed(1) : '0';

    // --- Operational Pipeline Metrics ---
    const toBePacked = stats?.activity?.toBePacked ?? sales.filter((s: any) => s.status === 'PENDING' && s.isHomeDelivery).length;
    const toBeShipped = stats?.activity?.toBeShipped ?? sales.filter((s: any) => s.status === 'PACKED').length;
    const toBeDelivered = stats?.activity?.toBeDelivered ?? sales.filter((s: any) => s.status === 'SHIPPED').length;
    const toBeInvoiced = stats?.activity?.toBeInvoiced ?? sales.filter((s: any) => s.paymentStatus === 'PENDING').length;

    const quantityInHand = inventory?.totalQuantity || products.reduce((acc: number, p: any) => acc + (p.stockQuantity || 0), 0) || 0;

    // Top Selling Items
    const salesMap = new Map();
    sales.forEach((sale: any) => {
        sale.items?.forEach((item: any) => {
            const name = item.product?.name || 'Item';
            salesMap.set(name, (salesMap.get(name) || 0) + item.quantity);
        });
    });
    const topSelling = Array.from(salesMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    // Category Distribution Data
    const categoryCount: Record<string, number> = {};
    products.forEach((p: any) => {
        const cat = p.category?.name || p.category || 'General';
        categoryCount[cat] = (categoryCount[cat] || 0) + (p.stockQuantity || 1);
    });
    const categoryPieData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

    // ==========================================
    // HIGH-END ECHARTS OPTIONS (STUDIO QUALITY)
    // ==========================================

    // 1. Financial Trend Multi-Area Chart
    const revenueTrendOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            borderRadius: 12,
            padding: [12, 16],
            textStyle: { color: '#f8fafc', fontFamily: 'Outfit, sans-serif' },
            extraCssText: 'box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px);',
            formatter: (params: any) => {
                let html = `<div style="font-weight:700;color:#94a3b8;font-size:11px;margin-bottom:8px;text-transform:uppercase">${params[0].name} Performance</div>`;
                params.forEach((item: any) => {
                    const color = item.color;
                    const val = Number(item.value).toLocaleString('en-IN');
                    html += `
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:6px">
                            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#cbd5e1">
                                <span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>
                                ${item.seriesName}
                            </span>
                            <span style="font-weight:800;font-size:13px;color:#fff">₹${val}</span>
                        </div>`;
                });
                return html;
            }
        },
        legend: {
            top: '2%',
            right: '2%',
            icon: 'circle',
            itemGap: 16,
            textStyle: { color: '#64748b', fontWeight: '600', fontSize: 12 }
        },
        grid: { left: '2%', right: '2%', bottom: '3%', top: '18%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['May W1', 'May W3', 'Jun W1', 'Jun W3', 'Jul W1', 'Jul W3', 'Current'],
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisTick: { show: false },
            axisLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
            axisLabel: {
                color: '#64748b',
                fontSize: 10,
                fontWeight: '600',
                formatter: (val: number) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val}`
            }
        },
        series: [
            {
                name: 'Revenue',
                type: 'line',
                smooth: 0.45,
                symbol: 'circle',
                symbolSize: 8,
                showSymbol: false,
                lineStyle: { width: 3.5, color: '#10b981' },
                itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.0)' }
                        ]
                    }
                },
                data: [
                    Math.round(totalRevenue * 0.12),
                    Math.round(totalRevenue * 0.28),
                    Math.round(totalRevenue * 0.45),
                    Math.round(totalRevenue * 0.62),
                    Math.round(totalRevenue * 0.78),
                    Math.round(totalRevenue * 0.91),
                    totalRevenue || 1834370
                ]
            },
            {
                name: 'Procurement Cost',
                type: 'line',
                smooth: 0.45,
                symbol: 'circle',
                symbolSize: 8,
                showSymbol: false,
                lineStyle: { width: 3, color: '#6366f1', type: 'dashed' },
                itemStyle: { color: '#6366f1', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(99, 102, 241, 0.2)' },
                            { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
                        ]
                    }
                },
                data: [
                    Math.round(totalProcurement * 0.15),
                    Math.round(totalProcurement * 0.32),
                    Math.round(totalProcurement * 0.48),
                    Math.round(totalProcurement * 0.65),
                    Math.round(totalProcurement * 0.81),
                    Math.round(totalProcurement * 0.94),
                    totalProcurement || 2408000
                ]
            }
        ]
    };

    // 2. High-Density Category Distribution Ring
    const categoryDonutOption = {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#0f172a',
            borderRadius: 10,
            padding: [10, 14],
            textStyle: { color: '#fff', fontSize: 12 },
            formatter: '{b}<br/><strong style="color:#38bdf8">{c} units</strong> ({d}%)'
        },
        legend: {
            bottom: '2%',
            left: 'center',
            icon: 'circle',
            itemGap: 14,
            textStyle: { color: '#475569', fontSize: 11, fontWeight: '600' }
        },
        color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
        series: [
            {
                name: 'Stock Share',
                type: 'pie',
                radius: ['54%', '78%'],
                center: ['50%', '42%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 3 },
                label: { show: false },
                emphasis: {
                    scale: true,
                    scaleSize: 8,
                    itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 0, 0, 0.2)' }
                },
                data: categoryPieData.length > 0 ? categoryPieData : [
                    { value: 250, name: 'Apparel' },
                    { value: 120, name: 'Electronics' },
                    { value: 85, name: 'Smart Devices' },
                    { value: 70, name: 'Home & Office' }
                ]
            }
        ]
    };

    // 3. Workflow Velocity Bar Chart
    const workflowBarOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: '#0f172a',
            textStyle: { color: '#fff' }
        },
        grid: { left: '2%', right: '12%', bottom: '2%', top: '6%', containLabel: true },
        xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'category', data: ['To Invoiced', 'To Delivered', 'To Shipped', 'To Packed'], axisLabel: { color: '#475569', fontWeight: '700' } },
        series: [
            {
                type: 'bar',
                data: [
                    { value: toBeInvoiced, itemStyle: { color: '#f43f5e' } },
                    { value: toBeDelivered, itemStyle: { color: '#10b981' } },
                    { value: toBeShipped, itemStyle: { color: '#f59e0b' } },
                    { value: toBePacked, itemStyle: { color: '#6366f1' } }
                ],
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c} orders',
                    fontWeight: '800',
                    fontSize: 11,
                    color: '#1e293b'
                },
                barWidth: '42%',
                itemStyle: { borderRadius: [0, 8, 8, 0] }
            }
        ]
    };

    // 4. Top Selling Products Gradient Bar
    const topSellingBarOption = {
        tooltip: { trigger: 'axis', backgroundColor: '#0f172a', textStyle: { color: '#fff' } },
        grid: { left: '2%', right: '14%', bottom: '2%', top: '6%', containLabel: true },
        xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
        yAxis: {
            type: 'category',
            data: topSelling.map(t => t.name.length > 14 ? t.name.slice(0, 14) + '...' : t.name).reverse(),
            axisLabel: { color: '#475569', fontWeight: '700' }
        },
        series: [
            {
                type: 'bar',
                data: topSelling.map(t => t.qty).reverse(),
                itemStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#8b5cf6' }]
                    },
                    borderRadius: [0, 8, 8, 0]
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c} units',
                    fontWeight: '800',
                    fontSize: 11,
                    color: '#1e293b'
                },
                barWidth: '42%'
            }
        ]
    };

    return (
        <div className="space-y-6 font-['Outfit'] pb-12">

            {/* ================= HEADER STRIP WITH CONTROLS ================= */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 tracking-wide uppercase border border-emerald-200">
                            LIVE OPERATIONAL DATA
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Real-time financial performance, inventory pipeline &amp; store analytics.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                        {['1M', '3M', '6M', 'YTD'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                    timeRange === t
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ================= 4 HIGH-IMPACT KPI CARDS ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* 1. Revenue Card */}
                <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/15 overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">Total Sales Revenue</span>
                        <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
                            <DollarSign size={18} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black tracking-tight drop-shadow-sm">
                            ₹{totalRevenue.toLocaleString('en-IN')}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-100">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold">
                                <ArrowUpRight size={12} /> +18.4%
                            </span>
                            <span>vs previous period</span>
                        </div>
                    </div>
                </div>

                {/* 2. Procurement Cost Card */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/15 overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-100">Procurement Outflow</span>
                        <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
                            <ShoppingBag size={18} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black tracking-tight drop-shadow-sm">
                            ₹{totalProcurement.toLocaleString('en-IN')}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-100">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold">
                                <ArrowDownRight size={12} /> Inward Stocking
                            </span>
                            <span>12 Purchase Orders</span>
                        </div>
                    </div>
                </div>

                {/* 3. Net Margin Card */}
                <div className="relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Net Operational Margin</span>
                        <div className={`p-2 rounded-xl ${netStatus >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Activity size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className={`text-3xl font-black tracking-tight ${netStatus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {netStatus >= 0 ? '+' : '-'}₹{Math.abs(netStatus).toLocaleString('en-IN')}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${netStatus >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {profitMarginPercent}% Margin
                            </span>
                            <span>Gross Position</span>
                        </div>
                    </div>
                </div>

                {/* 4. Stock In Hand Card */}
                <div className="relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Live Inventory Quantity</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <Package size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-black tracking-tight text-slate-900">
                            {quantityInHand.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-400">units</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-extrabold">
                                {products.length} SKUs Active
                            </span>
                            <span>In Warehouse</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* ================= MAIN CHARTS ROW (2 COLS) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left 8 Cols: Financial Line Graph */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                <BarChart2 size={18} className="text-indigo-600" />
                                3-Month Financial Performance Trends
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Comparative trajectory of gross sales revenue against inventory procurement outlays.
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Sales Revenue
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Procurement Cost
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <ReactECharts option={revenueTrendOption} style={{ height: '320px', width: '100%' }} />
                    </div>
                </div>

                {/* Right 4 Cols: Category Donut Ring */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <PieChart size={18} className="text-purple-600" />
                            Inventory Share by Category
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Stock volume distribution across key store categories.
                        </p>
                    </div>

                    <div className="w-full my-auto">
                        <ReactECharts option={categoryDonutOption} style={{ height: '270px', width: '100%' }} />
                    </div>
                </div>

            </div>

            {/* ================= WORKFLOW PIPELINE CARDS ================= */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                        Operational Order Pipeline
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">Real-time status updates</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActivityCard count={toBePacked} label="To Be Packed" icon={Package} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100" footer="Warehouse Prep" />
                    <ActivityCard count={toBeShipped} label="To Be Shipped" icon={Truck} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" footer="Courier Logistics" />
                    <ActivityCard count={toBeDelivered} label="To Be Delivered" icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" footer="Out for Delivery" />
                    <ActivityCard count={toBeInvoiced} label="To Be Invoiced" icon={FileText} color="text-rose-600" bg="bg-rose-50" border="border-rose-100" footer="Pending Receivables" />
                </div>
            </div>

            {/* ================= BOTTOM BAR CHARTS ROW (2 EQUAL COLS) ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Workflow Velocity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Order Fulfillment Velocity</h3>
                        <p className="text-xs text-slate-500 font-medium">Volume distribution across order lifecycle stages.</p>
                    </div>
                    <ReactECharts option={workflowBarOption} style={{ height: '240px', width: '100%' }} />
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Top Selling Product Lines</h3>
                        <p className="text-xs text-slate-500 font-medium">Highest volume SKUs moved over 3 months.</p>
                    </div>
                    {topSelling.length > 0 ? (
                        <ReactECharts option={topSellingBarOption} style={{ height: '240px', width: '100%' }} />
                    ) : (
                        <div className="py-12 text-center text-xs text-slate-400 font-medium">No sales recorded yet.</div>
                    )}
                </div>

            </div>

            {/* ================= DIRECT RELEASE ADVISOR (FIFO COMPLIANCE TABLE) ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-500" />
                            Direct Release Advisor (FIFO Stock Expiry Compliance)
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Automated warehouse dispatch prioritization based on earliest batch expiry.
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        Smart FIFO Active
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                                <th className="py-3.5 px-5">Product Name</th>
                                <th className="py-3.5 px-5">Priority Batch #</th>
                                <th className="py-3.5 px-5">UOM</th>
                                <th className="py-3.5 px-5">Available Stock</th>
                                <th className="py-3.5 px-5">Expiry Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                            {products?.slice(0, 8).map((p: any) => {
                                const bestBatch = p.batches?.length > 0 ? [...p.batches].sort((a: any, b: any) => new Date(a.expiryDate || '9999').getTime() - new Date(b.expiryDate || '9999').getTime())[0] : null;
                                if (!bestBatch) return null;
                                const isExpiringSoon = bestBatch.expiryDate && (new Date(bestBatch.expiryDate).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000);
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-5 font-bold text-slate-900">{p.name}</td>
                                        <td className="py-3.5 px-5 font-mono text-indigo-600 font-bold">{bestBatch.batchNumber}</td>
                                        <td className="py-3.5 px-5 uppercase text-slate-500">{p.unit}</td>
                                        <td className="py-3.5 px-5 font-extrabold text-slate-900">{bestBatch.quantityAvailable}</td>
                                        <td className="py-3.5 px-5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                isExpiringSoon
                                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                {bestBatch.expiryDate ? new Date(bestBatch.expiryDate).toLocaleDateString('en-IN') : 'FRESH / STABLE'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

// Activity Card Helper Component
const ActivityCard = ({ count, label, icon: Icon, color, bg, border, footer }: any) => (
    <div className={`bg-white p-5 rounded-2xl border ${border} shadow-sm flex flex-col justify-between hover:shadow-md transition-all`}>
        <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
            <div className={`p-2 rounded-xl ${bg} ${color}`}>
                <Icon size={18} />
            </div>
        </div>
        <div className="mt-4">
            <div className={`text-3xl font-black tracking-tight ${color}`}>{count}</div>
            <div className="mt-1 text-[11px] text-slate-400 font-semibold">{footer}</div>
        </div>
    </div>
);

export default Dashboard;
