import { useState, useRef } from 'react';
import { Mail, Phone, Plus, X, Camera } from 'lucide-react';
import { MemberRole } from '../types';

const initialMembers: any[] = [
  { id: '1', name: 'HON. DESIDERIO R. APAG III', role: 'Chair', designation: 'Commissioner, CHED / Chairperson', email: 'd.apag@ched.gov.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '/desiderio.jpg', isActive: true },
  { id: '2', name: 'HON. ANDRES C. PAGATPATAN, JR.', role: 'Vice Chair', designation: 'President, ESSU / Vice Chairperson', email: 'president@essu.edu.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { 
    id: '3', 
    name: 'SENATOR LOREN B. LEGARDA', 
    role: 'Member', 
    designation: 'Chairperson, Senate Committee on Higher, Technical and Vocational Education / Member', 
    email: 'loren.legarda@senate.gov.ph', 
    phone: 'N/A', 
    joinDate: '2023-01-01', 
    avatar: '',
    isActive: true,
    representative: { id: '5', name: 'HON. MARCELINO C. LIBANAN', designation: 'Representative', email: 'm.libanan@house.gov.ph', phone: 'N/A', avatar: '', isActive: true }
  },
  { 
    id: '4', 
    name: 'CONGRESSMAN JUDE A. ACIDRE', 
    role: 'Member', 
    designation: 'Chairperson, House Committee on Higher and Technical Education / Member', 
    email: 'jude.acidre@house.gov.ph', 
    phone: 'N/A', 
    joinDate: '2023-01-01', 
    avatar: '',
    isActive: true,
    representative: { id: '6', name: 'HON. CHRISTOPHER SHEEN P. GONZALES', designation: 'Representative', email: 'cs.gonzales@house.gov.ph', phone: 'N/A', avatar: '', isActive: true }
  },
  { id: '7', name: 'HON. JOHN GLENN D. OCAÑA', role: 'Member', designation: 'Regional Director, DOST - RO VIII / Member', email: 'jg.ocana@dost.gov.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '8', name: 'HON. MEYLENE C. ROSALES', role: 'Member', designation: 'Regional Director, NEDA - RO VIII / Member', email: 'mc.rosales@neda.gov.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '9', name: 'HON. GILBERT A. ESCOTO', role: 'Member', designation: 'Private Sector Representative / Member', email: 'g.escoto@private.org', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '10', name: 'HON. REYNALDO C. DORADO', role: 'Member', designation: 'Private Sector Representative / Member', email: 'r.dorado@private.org', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '11', name: 'HON. PEDRO WYNSTON M. LAGRAMADA', role: 'Member', designation: 'President, Federated Alumni Association / Member', email: 'p.lagramada@alumni.essu.edu.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '12', name: 'HON. REYNA ERIKA T. RIVERA', role: 'Member', designation: 'President, Federated Student Council Organization, Inc. / Member', email: 'r.rivera@student.essu.edu.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '13', name: 'HON. GERSHON G. ESCOTO, JR.', role: 'Member', designation: 'President, Federated Faculty Association / Member', email: 'g.escotojr@faculty.essu.edu.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
  { id: '14', name: 'DR. DEBBIE JOYCE R. VOLOSO', role: 'Secretary', designation: 'University Board Secretary', email: 'dj.voloso@essu.edu.ph', phone: 'N/A', joinDate: '2023-01-01', avatar: '', isActive: true },
];

export default function Members() {
  const [members, setMembers] = useState(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Member' as MemberRole, designation: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0], avatar: '', isActive: true });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember = { ...form, id: Math.random().toString(36).substr(2, 9) };
    setMembers([...members, newMember]);
    setShowForm(false);
    setForm({ name: '', role: 'Member' as MemberRole, designation: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0], avatar: '', isActive: true });
  };

  const toggleStatus = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) return { ...m, isActive: !m.isActive };
      if (m.representative?.id === id) {
        return { ...m, representative: { ...m.representative, isActive: !m.representative.isActive } };
      }
      return m;
    }));
  };

  const MemberCard = ({ member, isRep = false }: { member: any, isRep?: boolean }) => {
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
      <div className={`bg-white p-6 rounded-[2rem] border transition-all duration-300 ${!member.isActive ? 'opacity-40 grayscale' : ''} ${isRep ? 'border-amber-100 ml-12 mt-[-1rem] relative z-0 border-t-0 rounded-t-none bg-amber-50/20' : 'border-slate-100 shadow-sm z-10 relative'}`}>
        <div className="flex justify-end mb-2">
          <label className="relative inline-flex items-center cursor-pointer scale-75 origin-right">
            <input 
              type="checkbox" 
              checked={member.isActive} 
              onChange={() => toggleStatus(member.id)} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
            <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-12">
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-5 mb-4 relative">
      
          <div className="relative flex-shrink-0">
            
            <div className={`${isRep ? 'w-14 h-14' : 'w-20 h-20'} rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm`}>
              {member.avatar ? (
                <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">{member.name.charAt(0)}</div>
              )}
            </div>
          
            <div className={`absolute bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors duration-300 ${member.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`${isRep ? 'text-base' : 'text-lg'} font-bold text-[#1e293b] leading-tight mb-1`}>{member.name}</h3>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getRoleStyles(member.role)}`}>
              {isRep ? 'Representative' : member.role}
            </span>
          </div>
        </div>
        {!isRep && <p className="text-xs text-slate-400 font-medium italic mb-4 leading-relaxed">{member.designation}</p>}
        <div className="space-y-2 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Mail size={14} className="text-slate-300" /> <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Phone size={14} className="text-slate-300" /> <span>{member.phone}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12 max-w-6xl mx-auto">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col">
            <MemberCard member={m} />
            {m.representative && (
              <div className="relative">
                <div className="absolute left-10 top-0 w-0.5 h-4 bg-amber-200"></div>
                <MemberCard member={m.representative} isRep />
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-10 pt-8 pb-6 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-[#1e293b]">Add Board Member</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-slate-100 text-[#94a3b8] transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddMember} className="flex flex-col flex-1 min-h-0">
              <div className="px-10 pb-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex justify-center py-2 shrink-0">
                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full border-2 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center cursor-pointer hover:border-[#11a3e1] hover:bg-[#f0f9ff] transition-all group overflow-hidden">
                    {form.avatar ? <img src={form.avatar} className="w-full h-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center text-[#94a3b8] group-hover:text-[#11a3e1]"><Camera size={24} /><span className="text-[10px] font-bold uppercase mt-1">Upload</span></div>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
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
                    </select>
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
              <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
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