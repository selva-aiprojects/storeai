import React, { useState } from 'react';
import { Users, Plus, PhoneCall, Mail, DollarSign, X, CheckCircle, Sparkles } from 'lucide-react';

export default function CRM() {
    const [leads, setLeads] = useState([
        { id: '1', name: 'Acme Logistics Ltd', contact: 'Rajesh Kumar', email: 'rajesh@acmelogistics.in', stage: 'QUALIFIED', value: '₹5,50,000' },
        { id: '2', name: 'Apex Retail Stores', contact: 'Ananya Sharma', email: 'ananya@apexretail.com', stage: 'PROPOSAL', value: '₹2,20,000' },
        { id: '3', name: 'Metro Distributors', contact: 'Vikram Singh', email: 'vikram@metrodist.in', stage: 'NEW', value: '₹8,90,000' },
        { id: '4', name: 'Zenith Tech Solutions', contact: 'Pooja Reddy', email: 'pooja@zenithtech.io', stage: 'WON', value: '₹3,40,000' },
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        contact: '',
        email: '',
        stage: 'NEW',
        value: ''
    });

    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];

    const handleAddLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLead.name || !newLead.contact) return alert('Please enter company name and contact person.');

        const created = {
            id: Date.now().toString(),
            name: newLead.name,
            contact: newLead.contact,
            email: newLead.email || `${newLead.contact.toLowerCase().replace(/\s+/g, '')}@company.com`,
            stage: newLead.stage,
            value: newLead.value.startsWith('₹') ? newLead.value : `₹${newLead.value || '1,00,000'}`
        };

        setLeads(prev => [created, ...prev]);
        setNewLead({ name: '', contact: '', email: '', stage: 'NEW', value: '' });
        setIsAddModalOpen(false);
    };

    return (
        <div className="space-y-6 font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CRM & Sales Pipeline</h1>
                        <p className="text-sm text-slate-500">Track leads, deal stages, RFQ proposals & interaction timelines</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add New Lead / Deal
                </button>
            </div>

            {/* Pipeline Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {stages.map(st => {
                    const stageLeads = leads.filter(l => l.stage === st);
                    return (
                        <div key={st} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-w-[240px] space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">{st}</span>
                                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center">
                                    {stageLeads.length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {stageLeads.map(lead => (
                                    <div key={lead.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 hover:border-teal-500 transition-colors cursor-pointer">
                                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{lead.name}</h4>
                                        <p className="text-[11px] text-slate-500">{lead.contact}</p>
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                            <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">{lead.value}</span>
                                            <div className="flex gap-1.5 text-slate-400">
                                                <PhoneCall className="w-3.5 h-3.5 hover:text-teal-500" />
                                                <Mail className="w-3.5 h-3.5 hover:text-teal-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ADD LEAD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-teal-500" />
                                <h3 className="font-extrabold text-lg">Add New Lead / Deal Opportunity</h3>
                            </div>
                            <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white" onClick={() => setIsAddModalOpen(false)} />
                        </div>

                        <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-xs font-medium">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Organization / Client Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newLead.name}
                                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                    placeholder="e.g. Reliance Retail Division"
                                    className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Contact Person</label>
                                    <input
                                        type="text"
                                        required
                                        value={newLead.contact}
                                        onChange={e => setNewLead({ ...newLead, contact: e.target.value })}
                                        placeholder="e.g. Ramesh Shah"
                                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
                                    <input
                                        type="email"
                                        value={newLead.email}
                                        onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                        placeholder="ramesh@company.com"
                                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Deal Stage</label>
                                    <select
                                        value={newLead.stage}
                                        onChange={e => setNewLead({ ...newLead, stage: e.target.value })}
                                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-bold"
                                    >
                                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Estimated Deal Value (₹)</label>
                                    <input
                                        type="text"
                                        value={newLead.value}
                                        onChange={e => setNewLead({ ...newLead, value: e.target.value })}
                                        placeholder="5,00,000"
                                        className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle className="w-4 h-4" /> Save Lead to Pipeline
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
