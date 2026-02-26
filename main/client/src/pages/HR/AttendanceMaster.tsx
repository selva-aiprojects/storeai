import { useState, useEffect } from 'react';
import { Calendar, UserCheck, Clock, Plus, Filter, Save, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const AttendanceMaster = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, any>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [eResp, aResp] = await Promise.all([
                    api.get('/hr/employees'),
                    api.get(`/hr/attendance/report?month=${new Date(selectedDate).getMonth() + 1}&year=${new Date(selectedDate).getFullYear()}`)
                ]);
                setEmployees(eResp.data);

                // Map existing attendance for selected date
                const dailyAtt: Record<string, any> = {};
                aResp.data.filter((a: any) => a.date === selectedDate).forEach((a: any) => {
                    dailyAtt[a.employeeId] = a;
                });
                setAttendance(dailyAtt);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedDate]);

    const handleStatusChange = (empId: string, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [empId]: { ...prev[empId], status, employeeId: empId }
        }));
    };

    const handleOTChange = (empId: string, mins: number) => {
        setAttendance(prev => ({
            ...prev,
            [empId]: { ...prev[empId], otMins: mins, employeeId: empId }
        }));
    };

    const saveAttendance = async (empId: string) => {
        const data = attendance[empId];
        await api.post('/hr/attendance', {
            employeeId: empId,
            date: selectedDate,
            status: data.status || 'PRESENT',
            otMins: parseInt(data.otMins || 0),
            incentive: parseFloat(data.incentive || 0)
        });
        alert("Attendance logged.");
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Master</h1>
                    <p className="text-gray-500 text-sm">Capture daily presence, overtime, and field incentives</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 border rounded-xl shadow-sm">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            className="text-sm font-bold bg-transparent outline-none"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Details</th>
                            <th>Presence Status</th>
                            <th>Overtime (Mins)</th>
                            <th>Extra Incentives ($)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id}>
                                <td>
                                    <div className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{emp.designation}</div>
                                </td>
                                <td>
                                    <select
                                        className="px-3 py-1.5 border rounded-lg text-xs"
                                        value={attendance[emp.id]?.status || 'PRESENT'}
                                        onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                                    >
                                        <option value="PRESENT">Present</option>
                                        <option value="ABSENT">Absent</option>
                                        <option value="LEAVE">On Leave</option>
                                        <option value="HALF_DAY">Half Day</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="w-20 px-3 py-1.5 border rounded-lg text-xs font-mono"
                                        value={attendance[emp.id]?.otMins || 0}
                                        onChange={(e) => handleOTChange(emp.id, parseInt(e.target.value))}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="w-24 px-3 py-1.5 border rounded-lg text-xs font-mono"
                                        defaultValue={attendance[emp.id]?.incentives || 0}
                                        onBlur={(e) => setAttendance(p => ({ ...p, [emp.id]: { ...p[emp.id], incentive: e.target.value } }))}
                                    />
                                </td>
                                <td>
                                    <button
                                        className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition"
                                        onClick={() => saveAttendance(emp.id)}
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 border-l-4 border-l-blue-500">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Presence Summary</h4>
                    <div className="text-2xl font-black">{Object.values(attendance).filter(a => a.status === 'PRESENT').length} / {employees.length}</div>
                    <p className="text-[10px] text-gray-400 mt-1">Total active on field today</p>
                </div>
                <div className="card p-6 border-l-4 border-l-orange-500">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">OT Backlog</h4>
                    <div className="text-2xl font-black">
                        {Object.values(attendance).reduce((acc, curr) => acc + (curr.otMins || 0), 0)} min
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Accumulated overtime for payout</p>
                </div>
                <div className="card p-6 border-l-4 border-l-blue-500">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Leave Roster</h4>
                    <div className="text-2xl font-black">{Object.values(attendance).filter(a => a.status === 'LEAVE').length}</div>
                    <p className="text-[10px] text-gray-400 mt-1">Employees on approved vacation</p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceMaster;

