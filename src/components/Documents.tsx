import { useState, useEffect } from 'react';
import { Upload, Search, X, Lock, ShieldAlert, Eye } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

interface Document {
  id: string;
  title: string;
  file_name: string;
  storage_path: string;
  type: 'policy' | 'moa' | 'memo' | 'contract' | 'other';
  category: string;
  restriction: 'confidential' | 'controlled';
  size_bytes: number;
  uploaded_date: string;
}

export default function Documents() {
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  
  const [showUpload, setShowUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'policy' | 'moa' | 'memo' | 'contract' | 'other'>('policy');
  const [formCategory, setFormCategory] = useState('Administrative');
  const [formRestriction, setFormRestriction] = useState<'confidential' | 'controlled'>('controlled');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const types = ['all', 'policy', 'moa', 'memo', 'contract', 'other'];
  const coreCategories = ['Administrative', 'Academic', 'Finance', 'Legal', 'HR', 'Compliance'];
  

  const existingCategories = Array.from(
    new Set(
      documents.map(d => d.category.charAt(0).toUpperCase() + d.category.slice(1).toLowerCase())
    )
  ).filter(cat => cat !== 'Governance');

  const categories = Array.from(new Set([...coreCategories, ...existingCategories]));

  useEffect(() => {
    fetchDocuments();
  }, []);


  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .order('uploaded_date', { ascending: false });

      if (supabaseError) throw supabaseError;
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching items.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleViewDocument = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('boardsec-documents')
        .createSignedUrl(storagePath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating secure view link.');
    }
  };

  
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formTitle.trim()) {
      alert('Please fill out the title and choose a file to attach.');
      return;
    }

    try {
      setSubmitting(true);

      const fileExt = selectedFile.name.split('.').pop();
      const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const storagePath = `uploads/${uniqueFileName}`;

      const { error: storageError } = await supabase.storage
        .from('boardsec-documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

      
      const { error: tableError } = await supabase
        .from('documents')
        .insert([
          {
            title: formTitle.trim(),
            file_name: selectedFile.name,
            storage_path: storagePath,
            type: formType.toLowerCase(),
            category: formCategory, 
            restriction: formRestriction.toLowerCase(),
            size_bytes: selectedFile.size,
          }
        ]);

      if (tableError) throw tableError;

      setFormTitle('');
      setSelectedFile(null);
      setShowUpload(false);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving document configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const filtered = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType.toLowerCase();
    const matchesCategory = filterCategory === 'all' || d.category.toLowerCase() === filterCategory.toLowerCase();
    const isNotGovernance = d.category.toLowerCase() !== 'governance'; 
    
    return matchesSearch && matchesType && matchesCategory && isNotGovernance;
  });

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <p className="text-slate-500 mt-1 text-sm">
            {loading ? 'Synchronizing with database live node...' : `${filtered.length} active documents synced`}
          </p>
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
                  filterType === t 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-800 hover:text-slate-900'
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
                filterCategory === 'all' 
                  ? 'bg-amber-500 text-slate-900 font-semibold' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-800 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterCategory === c 
                    ? 'bg-amber-500 text-slate-900 font-semibold' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-800 hover:text-slate-900'
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Querying document records data stream...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="bg-white border border-slate-100 rounded-xl p-5 hover:border-sky-200 hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{doc.title}</h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{doc.file_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      
                      <button 
                        onClick={() => handleViewDocument(doc.storage_path)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </button>
                      <span className={`text-[10px] capitalize tracking-wider font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        doc.restriction === 'confidential'
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {doc.restriction === 'confidential' ? <Lock size={10} /> : <ShieldAlert size={10} />}
                        {doc.restriction}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded font-medium capitalize">{doc.category}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded font-medium capitalize">
                      {doc.type === 'moa' ? 'MOA' : doc.type}
                    </span>
                    <span>{formatSize(doc.size_bytes)}</span>
                    <span>Uploaded {formatDate(doc.uploaded_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleUploadSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Document Title</label>
                <input 
                  type="text" 
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2024 Faculty Handbook" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Type</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white"
                  >
                    <option value="policy">Policy</option>
                    <option value="moa">MOA</option>
                    <option value="memo">Memo</option>
                    <option value="contract">Contract</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wider">Restriction Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formRestriction === 'confidential' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200 hover:border-rose-200'}`}>
                    <input type="radio" name="restriction" value="confidential" checked={formRestriction === 'confidential'} onChange={() => setFormRestriction('confidential')} className="sr-only" />
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={16} className="text-rose-500" />
                      <span className="text-sm font-bold text-slate-900">Confidential</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Authorized personnel/executives only.</p>
                  </label>

                  <label className={`relative flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formRestriction === 'controlled' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-200'}`}>
                    <input type="radio" name="restriction" value="controlled" checked={formRestriction === 'controlled'} onChange={() => setFormRestriction('controlled')} className="sr-only" />
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-900">Controlled</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Internal use only. Shared across departments.</p>
                  </label>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors bg-slate-50/50">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.xlsx"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop file here or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, or XLSX up to 10MB</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" disabled={submitting} onClick={() => setShowUpload(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {submitting ? 'Uploading...' : 'Upload & Secure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}