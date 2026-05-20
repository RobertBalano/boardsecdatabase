import { useState, useEffect } from 'react';
import { Plus, X, Clock, CheckCircle2, XCircle, FileText, ChevronDown, Loader2, Upload, Paperclip } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

type ItemStatus = 'Pending' | 'Approved' | 'Deferred' | 'Colatilla' | 'Disapproved';

interface ActionItem {
  id: string;
  meeting_title: string;
  description: string;
  status: ItemStatus;
  reason: string;
  document_url?: string;
}

export default function ActionItems() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<ItemStatus | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', meetingTitle: '' });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  
  const [activeReason, setActiveReason] = useState<{ id: string; text: string } | null>(null);

  
  useEffect(() => {
    async function fetchActionItems() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('action_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActionItems();
  }, []);

  
  useEffect(() => {
    if (!activeReason) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('action_items')
          .update({ reason: activeReason.text })
          .eq('id', activeReason.id);

        if (error) throw error;

        
        setItems(prev => prev.map(i => i.id === activeReason.id ? { ...i, reason: activeReason.text } : i));
      } catch (err) {
        console.error('Failed to sync reason to Supabase:', err);
      }
    }, 600); 

    return () => clearTimeout(delayDebounceFn);
  }, [activeReason]);

  const filtered = items.filter(i => filter === 'All' || i.status === filter);
  const pending = items.filter(i => i.status === 'Pending');

  const groupedItems = filtered.reduce((groups: { [key: string]: ActionItem[] }, item) => {
    const title = item.meeting_title?.trim() || 'Uncategorized';
    if (!groups[title]) groups[title] = [];
    groups[title].push(item);
    return groups;
  }, {});


  async function updateItemData(id: string, updates: Partial<ActionItem>) {
    const previousState = [...items];
    
    
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));

    try {
      const { error } = await supabase
        .from('action_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      
      console.error('Supabase update execution rejected! Rolling back UI. Error context:', error);
      setItems(previousState);
    }
  }


  async function handleFileUpload(id: string, file: File) {
    if (!file) return;

    try {
      setUploadingId(id);

      
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `colatilla_docs/${fileName}`;

      
      const { error: uploadError } = await supabase.storage
        .from('action-item-docs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      
      const { data: publicUrlData } = supabase.storage
        .from('action-item-docs')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to retrieve public URL from bucket asset container.");
      }

      
      await updateItemData(id, { document_url: publicUrlData.publicUrl });
      
      alert('Document successfully uploaded and pinned to action item!');
    } catch (error: any) {
      console.error('File upload tracking breakdown caught:', error);
      alert(`Upload failed: ${error.message || 'Check storage bucket access policies.'}`);
    } finally {
      setUploadingId(null);
    }
  }

  
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('action_items')
        .insert([
          {
            meeting_title: form.meetingTitle,
            description: form.description,
            status: 'Pending',
            reason: '',
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setItems(prev => [data[0], ...prev]);
      }
      setForm({ description: '', meetingTitle: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create action item:', error);
    }
  }

  const getStatusConfig = (status: ItemStatus) => {
    switch (status) {
      case 'Approved': return { color: 'text-emerald-600 bg-emerald-50', icon: <CheckCircle2 size={16} /> };
      case 'Deferred': return { color: 'text-amber-600 bg-amber-50', icon: <Clock size={16} /> };
      case 'Colatilla': return { color: 'text-purple-600 bg-purple-50', icon: <FileText size={16} /> };
      case 'Disapproved': return { color: 'text-rose-600 bg-rose-50', icon: <XCircle size={16} /> };
      default: return { color: 'text-slate-500 bg-slate-100', icon: <Clock size={16} /> };
    }
  };

  return (
    <div className="p-8">
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Action Items</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {pending.length} pending · {items.length - pending.length} processed
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Plus size={16} /> Add Action
        </button>
      </div>

      
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {(['All', 'Pending', 'Approved', 'Deferred', 'Colatilla', 'Disapproved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12 text-slate-400 gap-2 text-sm">
          <Loader2 className="animate-spin" size={20} /> Loading database items...
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedItems).map(([title, meetingItems]) => (
            <div key={title} className="space-y-4 border-l-2 border-slate-100 pl-4 ml-1">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {title}
              </h2>
              
              <div className="space-y-3">
                {meetingItems.map(item => {
                  const config = getStatusConfig(item.status);
                  return (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                              {config.icon} {item.status}
                            </span>
                          </div>
                          <p className={`text-sm font-semibold leading-relaxed transition-all ${
                            item.status === 'Disapproved' 
                              ? 'text-rose-800 line-through decoration-rose-300' 
                              : item.status === 'Approved' 
                                ? 'text-slate-400' 
                                : 'text-slate-800'
                          }`}>
                            {item.description}
                          </p>
                          
                          
                          {item.status === 'Colatilla' && (
                            <div className="mt-4 flex flex-col gap-2">
                              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl inline-block max-w-max">
                                <p className="text-[11px] text-purple-600 font-bold italic flex items-center gap-2">
                                  <FileText size={14} />
                                  To be followed by supporting document(s)
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-3 mt-1">
                                <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold cursor-pointer transition-colors border border-purple-200">
                                  {uploadingId === item.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Upload size={14} />
                                  )}
                                  {item.document_url ? 'Replace Document' : 'Upload Support File'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    disabled={uploadingId === item.id}
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])} 
                                  />
                                </label>

                                {item.document_url && (
                                  <a 
                                    href={item.document_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline flex items-center gap-1"
                                  >
                                    <Paperclip size={12} /> View Document
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          
                          {item.status === 'Disapproved' && (
                            <div className="mt-3 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                              <label className="block text-[10px] font-black text-rose-400 uppercase mb-1">Reason</label>
                              <input 
                                type="text"
                                placeholder="State supporting disapproval rationale..."
                                value={activeReason?.id === item.id ? activeReason.text : (item.reason || '')}
                                onChange={(e) => {
                                  
                                  setActiveReason({ id: item.id, text: e.target.value });
                                  setItems(prev => prev.map(i => i.id === item.id ? { ...i, reason: e.target.value } : i));
                                }}
                                onBlur={() => setActiveReason(null)}
                                className="w-full bg-transparent text-sm text-rose-800 outline-none"
                              />
                            </div>
                          )}
                        </div>

                       
                        <div className="relative">
                          <select 
                            value={item.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value as ItemStatus;
                              updateItemData(item.id, { 
                                status: nextStatus,
                                reason: nextStatus !== 'Disapproved' ? '' : item.reason
                              });
                            }}
                            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-4 pr-10 rounded-xl outline-none cursor-pointer hover:bg-slate-100 transition-all"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Deferred">Deferred</option>
                            <option value="Colatilla">Colatilla</option>
                            <option value="Disapproved">Disapproved</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      
      {showForm && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-black text-slate-900 uppercase tracking-tight">New Action Entry</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Task description..."
                  className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:border-sky-500 outline-none transition-all resize-none min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Meeting Reference</label>
                <input
                  type="text"
                  required
                  value={form.meetingTitle}
                  onChange={e => setForm(p => ({ ...p, meetingTitle: e.target.value }))}
                  placeholder="e.g. Q1 2026 BOARD MEETING"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:border-sky-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all">
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}