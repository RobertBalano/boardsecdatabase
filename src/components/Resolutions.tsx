import { Plus } from 'lucide-react';
import { mockResolutions } from '../data/mockData';

export default function Resolutions() {
  // Filter to only show approved resolutions
  const approvedResolutions = mockResolutions.filter(res => res.status === 'approved');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Resolutions</h1>
          <p className="text-slate-500 mt-1 text-sm">Official board governance decisions</p>
        </div>
        <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100">
          <Plus size={16} />
          New Resolution
        </button>
      </div>

      <div className="space-y-3">
        {approvedResolutions.map(res => (
          <div key={res.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {res.number} - {res.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{res.description}</p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-50 text-emerald-600">
                Approved
              </span>
            </div>
          </div>
        ))}
        
        {approvedResolutions.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No approved resolutions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}