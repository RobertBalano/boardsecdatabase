import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar, Users, X, Search, Upload } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface MinuteDocument {
  id: string;
  title: string;
  date: string;
  attendees_count: number;
  file_name: string;
  storage_path: string;
  summary_snippet?: string;
  created_at?: string;
}

export default function Minutes() {
  const [minutesList, setMinutesList] = useState<MinuteDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  
  const [showUpload, setShowUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formAttendeesCount, setFormAttendeesCount] = useState<string>(''); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMinutes();
  }, []);

  const fetchMinutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('meeting_minutes')
        .select('*')
        .order('date', { ascending: false });

      if (supabaseError) throw supabaseError;
      setMinutesList(data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching meeting minutes.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formTitle.trim() || !formDate || !formAttendeesCount) {
      alert('Please fill out the title, date, attendee count, and attach a valid minutes document.');
      return;
    }

    try {
      setSubmitting(true);
      const fileExt = selectedFile.name.split('.').pop();
      const uniqueFileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const storagePath = `minutes/${uniqueFileName}`;

      
      const { error: storageError } = await supabase.storage
        .from('boardsec-documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

    
      const { error: tableError } = await supabase
        .from('meeting_minutes')
        .insert([
          {
            title: formTitle.trim(),
            date: formDate,
            attendees_count: parseInt(formAttendeesCount, 10), 
            file_name: selectedFile.name,
            storage_path: storagePath,
            summary_snippet: `MINUTES OF THE ${formTitle.trim().toUpperCase()} Date: ${formatDate(formDate)} Attendees Count: ${formAttendeesCount}`
          }
        ]);

      if (tableError) throw tableError;

  
      setFormTitle('');
      setFormDate('');
      setFormAttendeesCount('');
      setSelectedFile(null);
      setShowUpload(false);
      fetchMinutes();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving minutes record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMinutes = async (storagePath: string) => {
    try {
      const { data, error: urlError } = await supabase.storage
        .from('boardsec-documents')
        .createSignedUrl(storagePath, 60);

      if (urlError) throw urlError;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating secure preview link.');
    }
  };

  const handleExportMinutes = async (storagePath: string, fileName: string) => {
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('boardsec-documents')
        .download(storagePath);

      if (downloadError) throw downloadError;

      const blobUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Error downloading file for local export.');
    }
  };

  const filtered = minutesList.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Minutes</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {loading ? 'Querying document records data stream...' : `${filtered.length} documents on file`}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Upload size={16} />
          Upload Minutes
        </button>
      </div>

    
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search minutes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white"
        />
      </div>

      {error && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">{error}</div>}

      
      <div className="space-y-3">
        {filtered.map(minute => (
          <div key={minute.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-sky-100 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{minute.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-slate-400" />
                      {formatDate(minute.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={11} className="text-slate-400" />
                      {minute.attendees_count || 0} attendees
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewMinutes(minute.storage_path)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye size={13} />
                  View
                </button>
                <button 
                  onClick={() => handleExportMinutes(minute.storage_path, minute.file_name)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Export
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No minutes found</p>
            <p className="text-slate-400 text-sm mt-1">Minutes are recorded after meetings are completed</p>
          </div>
        )}
      </div>

      
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900">Upload Meeting Minutes</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleUploadSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Meeting Title</label>
                <input 
                  type="text" 
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Q1 2026 Board Meeting" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Meeting Date</label>
                <input 
                  type="date" 
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Number of Attendees</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={formAttendeesCount}
                  onChange={(e) => setFormAttendeesCount(e.target.value)}
                  placeholder="e.g. 8" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" 
                />
              </div>

              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors bg-slate-50/50">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop file here or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, or TXT up to 10MB</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" disabled={submitting} onClick={() => setShowUpload(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {submitting ? 'Uploading...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}