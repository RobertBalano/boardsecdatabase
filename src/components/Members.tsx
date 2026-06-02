import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Plus, X, Camera, Edit2, Check } from 'lucide-react';
import { MemberRole } from '../types';
import { supabase } from '../supabaseClient'; 

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  
  const [form, setForm] = useState({
    name: '',
    role: 'Member' as MemberRole,
    designation: '',
    email: '',
    phone: '',
    avatar: '',
    is_active: true,
    representative_for_id: null as string | null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('board_members')
      .select(`
        id, name, role, designation, email, phone, avatar, is_active,
        representative:board_members!representative_for_id(
          id, name, role, designation, email, phone, avatar, is_active
        )
      `)
      .is('representative_for_id', null) 
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('board_members')
      .insert([{
        name: form.name,
        role: form.role,
        designation: form.designation || 'N/A',
        email: form.email,
        phone: form.phone || 'N/A',
        avatar: form.avatar,
        is_active: form.is_active,
        representative_for_id: form.representative_for_id
      }]);

    if (!error) {
      setShowForm(false);
      setForm({ name: '', role: 'Member' as MemberRole, designation: '', email: '', phone: '', avatar: '', is_active: true, representative_for_id: null });
      fetchMembers();
    }
  };

  
  const startEditing = (member: any) => {
    setEditingId(member.id);
    setEditForm({ ...member });
  };

  
  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from('board_members')
      .update({
        name: editForm.name,
        role: editForm.role,
        designation: editForm.designation,
        email: editForm.email,
        phone: editForm.phone,
        avatar: editForm.avatar
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      fetchMembers();
    }
  };

  
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('board_members')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchMembers();
    }
  };

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'create') {
          setForm({ ...form, avatar: reader.result as string });
        } else {
          setEditForm({ ...editForm, avatar: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const MemberCard = ({ member, isRep = false }: { member: any, isRep?: boolean }) => {
    const isEditing = editingId === member.id;

    const getRoleStyles = (role: string) => {
      if (isRep) return 'bg-amber-100 text-amber-600';
      switch (role) {
        case 'Chair': return 'bg-sky-100 text-sky-600';
        case 'Vice Chair': return 'bg-emerald-100 text-emerald-600';
        case 'Secretary': return 'bg-purple-100 text-purple-600';
        default: return 'bg-slate-100 text-slate-600';
      }
    };

    return (
      <div className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 ${!member.is_active ? 'opacity-40 grayscale' : ''} ${isRep ? 'border-amber-100 ml-12 mt-[-1rem] relative z-0 border-t-0 rounded-t-none bg-amber-50/20' : 'border-slate-100 shadow-sm z-10 relative'}`}>
        
        
        <div className="flex justify-between items-center mb-2">
          <div>
            {isEditing ? (
              <button onClick={() => handleSaveEdit(member.id)} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full">
                <Check size={12} /> Save
              </button>
            ) : (
              <button onClick={() => startEditing(member)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-medium">
                <Edit2 size={12} /> Edit Info
              </button>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer scale-75 origin-right">
            <input 
              type="checkbox" 
              checked={member.is_active} 
              onChange={() => toggleStatus(member.id, member.is_active)} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
            <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-12">
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>

        
        <div className="flex items-center gap-5 mb-4 relative">
          <div className="relative flex-shrink-0">
            <div 
              onClick={() => isEditing && editFileInputRef.current?.click()}
              className={`${isRep ? 'w-14 h-14' : 'w-20 h-20'} rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm ${isEditing ? 'cursor-pointer ring-2 ring-sky-400' : ''}`}
            >
              {isEditing ? (
                editForm?.avatar ? (
                  <img src={editForm.avatar} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50"><Camera size={16} /></div>
                )
              ) : member.avatar ? (
                <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">{member.name.charAt(0)}</div>
              )}
            </div>
            {isEditing && <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'edit')} />}
            <div className={`absolute bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${member.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {isEditing ? (
              <input className="w-full border rounded px-2 py-1 text-sm font-bold bg-slate-50 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            ) : (
              <h3 className={`${isRep ? 'text-base' : 'text-lg'} font-bold text-[#1e293b] leading-tight mb-1`}>{member.name}</h3>
            )}

            {isEditing ? (
              <select className="border text-xs rounded px-1.5 py-0.5 bg-slate-50" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                <option value="Chair">Chair</option>
                <option value="Vice Chair">Vice Chair</option>
                <option value="Secretary">Secretary</option>
                <option value="Member">Member</option>
                <option value="Representative">Representative</option>
              </select>
            ) : (
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getRoleStyles(member.role)}`}>
                {isRep ? 'Representative' : member.role}
              </span>
            )}
          </div>
        </div>

        {!isRep && (
          <div className="mb-4">
            {isEditing ? (
              <textarea rows={2} className="w-full border rounded px-2 py-1 text-xs bg-slate-50 outline-none resize-none" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
            ) : (
              <p className="text-xs text-slate-400 font-medium italic leading-relaxed">{member.designation}</p>
            )}
          </div>
        )}

        <div className="space-y-2 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Mail size={14} className="text-slate-300" /> 
            {isEditing ? (
              <input className="flex-1 border rounded px-2 py-0.5 text-xs bg-slate-50 outline-none" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            ) : (
              <span className="truncate">{member.email}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Phone size={14} className="text-slate-300" /> 
            {isEditing ? (
              <input className="flex-1 border rounded px-2 py-0.5 text-xs bg-slate-50 outline-none" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
            ) : (
              <span>{member.phone}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-10 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Governing Board</h1>
          <p className="text-slate-400 text-sm">Management of University Board Members</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-sky-100 active:scale-95">
          <Plus size={20} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading Board Configurations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12 max-w-6xl mx-auto">
          {members.map((m) => (
            <div key={m.id} className="flex flex-col">
              <MemberCard member={m} />
              {m.representative && m.representative.map((rep: any) => (
                <div key={rep.id} className="relative">
                  <div className="absolute left-10 top-0 w-0.5 h-4 bg-amber-200"></div>
                  <MemberCard member={rep} isRep />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      
      {showForm && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Main Card Element */}
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            
            
            <div className="px-10 pt-8 pb-6 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-[#1e293b]">Add Board Member</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-slate-100 text-[#94a3b8] transition-colors">
                <X size={24} />
              </button>
            </div>

            
            <form onSubmit={handleAddMember} className="flex flex-col flex-1 min-h-0">
              
              
              <div className="px-10 pb-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
                
              
                <div className="flex justify-center py-2 shrink-0">
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center cursor-pointer hover:border-[#11a3e1] hover:bg-[#f0f9ff] transition-all group overflow-hidden">
                    {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center text-[#94a3b8] group-hover:text-[#11a3e1]"><Camera size={24} /><span className="text-[10px] font-bold uppercase mt-1">Upload</span></div>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'create')} />
                </div>

                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#475569] mb-1.5">Full Name</label>
                    <input required className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none focus:border-[#11a3e1]" placeholder="Jane Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#475569] mb-1.5">Role</label>
                    <select className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none" value={form.role} onChange={e => setForm({...form, role: e.target.value as MemberRole})}>
                      <option value="Chair">Chair</option>
                      <option value="Vice Chair">Vice Chair</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Member">Member</option>
                      <option value="Representative">Representative</option>
                    </select>
                  </div>

                 
               {(form.role as string) === 'Representative' && (
  <div>
    <label className="block text-sm font-bold text-[#475569] mb-1.5">Representative For</label>
    <select 
      className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none" 
      value={form.representative_for_id || ''} 
      onChange={e => setForm({...form, representative_for_id: e.target.value || null})}
    >
      <option value="">Select Board Member...</option>
      {members.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  </div>
)}

                  <div>
                    <label className="block text-sm font-bold text-[#475569] mb-1.5">Designation</label>
                    <input className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none focus:border-[#11a3e1]" placeholder="e.g. University Board Secretary" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#475569] mb-1.5">Email Address</label>
                    <input type="email" required className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none focus:border-[#11a3e1]" placeholder="example@essu.edu.ph" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#475569] mb-1.5">Phone Number</label>
                    <input className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 bg-[#f8fafc] outline-none focus:border-[#11a3e1]" placeholder="+63 900 000 0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
              </div>

              
              <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-b-[2.5rem]">
                <button type="button" onClick={() => setShowForm(false)} className="font-bold text-[#64748b] px-4 hover:text-[#1e293b]">Cancel</button>
                <button type="submit" className="bg-[#0ea5e9] text-white font-bold py-3.5 px-10 rounded-xl hover:bg-[#0284c7] transition-all shadow-lg">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}