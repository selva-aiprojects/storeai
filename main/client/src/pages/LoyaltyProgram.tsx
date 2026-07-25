import React, { useState } from 'react';
import { Award, Gift, Sparkles, Star, Plus, X, CheckCircle } from 'lucide-react';

export default function LoyaltyProgram() {
    const [tiers, setTiers] = useState([
        { name: 'Bronze Tier', pointsReq: '0 - 500 Pts', earnMultiplier: '1x Points per ₹100', color: 'from-amber-600 to-amber-700' },
        { name: 'Silver Tier', pointsReq: '501 - 2,000 Pts', earnMultiplier: '1.5x Points per ₹100', color: 'from-slate-400 to-slate-600' },
        { name: 'Gold Tier', pointsReq: '2,001 - 5,000 Pts', earnMultiplier: '2x Points per ₹100', color: 'from-amber-400 to-yellow-500' },
        { name: 'Platinum Tier', pointsReq: '5,000+ Pts', earnMultiplier: '3x Points + Free Express Shipping', color: 'from-rose-500 to-indigo-600' },
    ]);

    const [recentLedger, setRecentLedger] = useState([
        { customer: 'Rohan Mehta', type: 'EARN', points: '+150', desc: 'Earned on Sale POS-90812', date: 'Today' },
        { customer: 'Priya Sharma', type: 'REDEEM', points: '-300', desc: 'Redeemed ₹300 Voucher on Checkout', date: 'Yesterday' },
        { customer: 'Kiran Verma', type: 'BONUS', points: '+500', desc: 'Gold Tier Milestone Bonus', date: '23 Jul 2026' },
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTier, setNewTier] = useState({
        name: '',
        pointsReq: '',
        earnMultiplier: ''
    });

    const handleAddTierSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTier.name) return alert('Please enter tier name.');

        const created = {
            name: newTier.name,
            pointsReq: newTier.pointsReq || '5,000+ Pts',
            earnMultiplier: newTier.earnMultiplier || '2.5x Points per ₹100',
            color: 'from-cyan-500 to-blue-600'
        };

        setTiers(prev => [...prev, created]);
        setNewTier({ name: '', pointsReq: '', earnMultiplier: '' });
        setIsAddModalOpen(false);
    };

    return (
        <div className="space-y-6 font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loyalty & Rewards Program</h1>
                        <p className="text-sm text-slate-500">Configure point earning rules, customer tiers & voucher redemptions</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add Reward Tier Rule
                </button>
            </div>

            {/* Loyalty Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map(t => (
                    <div key={t.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 relative overflow-hidden shadow-sm">
                        <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${t.color}`} />
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {t.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">Requirement: {t.pointsReq}</p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{t.earnMultiplier}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Points Activity Ledger */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Loyalty Points Ledger</h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recentLedger.map((item, idx) => (
                        <div key={idx} className="py-3 flex justify-between items-center text-xs">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">{item.customer}</p>
                                <p className="text-[11px] text-slate-400">{item.desc} • {item.date}</p>
                            </div>
                            <span className={`font-extrabold text-sm ${item.type === 'REDEEM' ? 'text-slate-500' : 'text-rose-600 dark:text-rose-400'}`}>
                                {item.points} Pts
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ADD TIER MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-rose-500" />
                                <h3 className="font-extrabold text-base">Add Loyalty Tier Rule</h3>
                            </div>
                            <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white" onClick={() => setIsAddModalOpen(false)} />
                        </div>

                        <form onSubmit={handleAddTierSubmit} className="space-y-3.5 text-xs font-medium">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Tier Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newTier.name}
                                    onChange={e => setNewTier({ ...newTier, name: e.target.value })}
                                    placeholder="e.g. VIP Diamond Tier"
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Points Threshold Requirement</label>
                                <input
                                    type="text"
                                    value={newTier.pointsReq}
                                    onChange={e => setNewTier({ ...newTier, pointsReq: e.target.value })}
                                    placeholder="e.g. 10,000+ Pts"
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Multiplier / Perk Description</label>
                                <input
                                    type="text"
                                    value={newTier.earnMultiplier}
                                    onChange={e => setNewTier({ ...newTier, earnMultiplier: e.target.value })}
                                    placeholder="e.g. 4x Points + Personal Concierge"
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle className="w-4 h-4" /> Save Loyalty Tier
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
