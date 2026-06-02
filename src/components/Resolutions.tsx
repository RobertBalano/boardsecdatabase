import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../supabaseClient'; 
import { Resolution } from '../types';         

export default function Resolutions() {
  const [approvedResolutions, setApprovedResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    description: ''
  });

  
  async function fetchApprovedResolutions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resolutions')
        .select('id, number, title, description')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      setApprovedResolutions((data as Resolution[]) || []);
    } catch (error: any) {
      console.error('Error fetching resolutions:', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApprovedResolutions();
  }, []);

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.title) return alert('Resolution Number and Title are required');

    try {
      setSubmitting(true);

      
      const { data, error } = await supabase
        .from('resolutions')
        .insert([
          {
            number: formData.number,
            title: formData.title,
            description: formData.description,
            status: 'approved' 
          }
        ])
        .select(); 

      if (error) throw error;

      
      if (data && data.length > 0) {
        setApprovedResolutions(prev => [data[0] as Resolution, ...prev]);
      }

    
      setIsModalOpen(false);
      setFormData({ number: '', title: '', description: '' });

    } catch (error: any) {
      console.error('Error creating resolution:', error.message);
      alert('Failed to save resolution: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 relative">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Resolutions</h1>
          <p className="text-slate-500 mt-1 text-sm">Official board governance decisions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Plus size={16} />
          New Resolution
        </button>
      </div>

    
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm animate-pulse">Loading approved resolutions...</p>
          </div>
        ) : (
          <>
            {approvedResolutions.map((res) => (
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
          </>
        )}
      </div>

      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            
            
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">Add New Resolution</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Number</label>
                <input 
                  type="text" 
                  name="number"
                  placeholder="e.g., RES-2026-05"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="e.g., Authorization of Security Audit"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  name="description"
                  rows={3}
                  placeholder="Provide resolution summary decisions here..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

              
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}