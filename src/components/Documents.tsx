import { useState } from 'react';
import { Upload, Search, X, Lock, ShieldAlert } from 'lucide-react';
import { Document } from '../types';
import { mockDocuments } from '../data/mockData';

const typeIcons: Record<string, string> = {
  policy: '📋',
  moa: '🤝',
  memo: '📝',
  contract: '📄',
  other: '📎',
};

export default function Documents() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [, setSelected] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const existingCategories = Array.from(new Set(documents.map(d => d.category)))
    .filter(cat => cat !== 'Governance'); // Filter out Governance here
    
  const coreCategories = ['Administrative', 'Academic'];
  const categories = Array.from(new Set([...coreCategories, ...existingCategories]));
  
  const types = ['all', 'policy', 'moa', 'memo', 'contract', 'other'];

  const filtered = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    const matchesArchive = showArchived ? d.archived : !d.archived;
    const isNotGovernance = d.category !== 'Governance'; 
    
    return matchesSearch && matchesType && matchesCategory && matchesArchive && isNotGovernance;
  });

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents & Records</h1>
          <p className="text-slate-500 mt-1 text-sm">{filtered.filter(d => !d.archived).length} active documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white"
          />
        </div>

        <div className="flex flex-col gap-3">
            <div className="flex gap-3 flex-wrap items-center">
                <span className="text-xs font-medium text-slate-500 w-16">Type:</span>
                {types.map(t => (
                    <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterType === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                    >
                    {t === 'moa' ? 'MOA' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <div className="flex gap-3 flex-wrap items-center">
                <span className="text-xs font-medium text-slate-500 w-16">Category:</span>
                <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                >
                    All
                </button>
                {categories.map(c => (
                    <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterCategory === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                    >
                    {c}
                    </button>
                ))}
            </div>
        </div>

        <label className="flex items-center gap-2 text-sm pt-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          />
          <span className="text-slate-600">Show archived documents</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(doc => (
          <div
            key={doc.id}
            onClick={() => setSelected(doc)}
            className="bg-white border border-slate-100 rounded-xl p-5 cursor-pointer hover:border-sky-200 hover:shadow-md transition-all group relative"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">{typeIcons[doc.type] || '📎'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{doc.title}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{doc.fileName}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      doc.id.includes('confidential') 
                        ? 'bg-rose-50 text-rose-700 border-rose-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {doc.id.includes('confidential') ? <Lock size={10} /> : <ShieldAlert size={10} />}
                        {doc.id.includes('confidential') ? 'Confidential' : 'Controlled'}
                    </span>
                    {doc.archived && <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex-shrink-0">Archived</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{doc.category}</span>
                  <span>{formatSize(doc.size)}</span>
                  <span>Uploaded {formatDate(doc.uploadedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Document Title</label>
                <input type="text" placeholder="e.g. 2024 Faculty Handbook" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Type</label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white">
                        <option value="policy">Policy</option>
                        <option value="moa">MOA</option>
                        <option value="memo">Memo</option>
                        <option value="contract">Contract</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white">
                        {categories.map(cat => (
                            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wider">Restriction Level</label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="relative flex flex-col p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-rose-200 hover:bg-rose-50/30 transition-all has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50/50 group">
                        <input type="radio" name="restriction" value="confidential" className="sr-only" />
                        <div className="flex items-center gap-2 mb-1">
                            <Lock size={16} className="text-rose-500" />
                            <span className="text-sm font-bold text-slate-900">Confidential</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Strictly for authorized personnel and executives only.</p>
                    </label>

                    <label className="relative flex flex-col p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-amber-200 hover:bg-amber-50/30 transition-all has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/50">
                        <input type="radio" name="restriction" value="controlled" className="sr-only" defaultChecked />
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert size={16} className="text-amber-500" />
                            <span className="text-sm font-bold text-slate-900">Controlled</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Internal use only. Shared with specific departments.</p>
                    </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors cursor-pointer bg-slate-50/50">
                <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">Drop file here or click to browse</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, or XLSX up to 10MB</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Upload & Secure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}