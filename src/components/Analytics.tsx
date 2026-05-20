import { mockReports } from '../data/mockData';
import { useState } from 'react';

export default function Analytics() {
  const [reports] = useState(mockReports);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 mt-1 text-sm">Board performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase">Meeting Attendance</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">94%</p>
          <p className="text-xs text-emerald-600 mt-1">Up 2% from last quarter</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase">Action Items</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">89%</p>
          <p className="text-xs text-emerald-600 mt-1">Completion rate</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase">Policy Compliance</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">100%</p>
          <p className="text-xs text-emerald-600 mt-1">All policies current</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100">
          <p className="text-slate-500 text-xs font-medium uppercase">Risk Items</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">0</p>
          <p className="text-xs text-slate-500 mt-1">Current open issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {reports.map(report => (
          <div key={report.id} className="bg-white border border-slate-100 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 text-sm">{report.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{report.period}</p>
            <p className="text-xs text-slate-600 mt-3">{report.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
