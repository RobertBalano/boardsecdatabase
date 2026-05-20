import { useState, useEffect } from 'react';
import { Shield, ShieldOff, Mail, UserCheck, UserMinus, Search } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
  designation: string;
  email: string;
  isActive: boolean;
  representative?: {
    id: string;
    name: string;
    designation: string;
    email: string;
    isActive: boolean;
  };
}

export default function ManageAccount() {
  const defaultMembers: Member[] = [
    { id: '1', name: 'HON. DESIDERIO R. APAG III', role: 'Chair', designation: 'Commissioner, CHED / Chairperson', email: 'd.apag@ched.gov.ph', isActive: true },
    { id: '2', name: 'HON. ANDRES C. PAGATPATAN, JR.', role: 'Vice Chair', designation: 'President, ESSU / Vice Chairperson', email: 'president@essu.edu.ph', isActive: true },
    { id: '3', name: 'SENATOR LOREN B. LEGARDA', role: 'Member', designation: 'Chairperson, Senate Committee on Higher, Technical and Vocational Education / Member', email: 'loren.legarda@senate.gov.ph', isActive: true, representative: { id: '5', name: 'HON. MARCELINO C. LIBANAN', designation: 'Representative', email: 'm.libanan@house.gov.ph', isActive: true } },
    { id: '4', name: 'CONGRESSMAN JUDE A. ACIDRE', role: 'Member', designation: 'Chairperson, House Committee on Higher and Technical Education / Member', email: 'jude.acidre@house.gov.ph', isActive: true, representative: { id: '6', name: 'HON. CHRISTOPHER SHEEN P. GONZALES', designation: 'Representative', email: 'cs.gonzales@house.gov.ph', isActive: true } },
    { id: '7', name: 'HON. JOHN GLENN D. OCAÑA', role: 'Member', designation: 'Regional Director, DOST - RO VIII / Member', email: 'jg.ocana@dost.gov.ph', isActive: true },
    { id: '8', name: 'HON. MEYLENE C. ROSALES', role: 'Member', designation: 'Regional Director, NEDA - RO VIII / Member', email: 'mc.rosales@neda.gov.ph', isActive: true },
    { id: '9', name: 'HON. GILBERT A. ESCOTO', role: 'Member', designation: 'Private Sector Representative / Member', email: 'g.escoto@private.org', isActive: true },
    { id: '10', name: 'HON. REYNALDO C. DORADO', role: 'Member', designation: 'Private Sector Representative / Member', email: 'r.dorado@private.org', isActive: true },
    { id: '11', name: 'HON. PEDRO WYNSTON M. LAGRAMADA', role: 'Member', designation: 'President, Federated Alumni Association / Member', email: 'p.lagramada@alumni.essu.edu.ph', isActive: true },
    { id: '12', name: 'HON. REYNA ERIKA T. RIVERA', role: 'Member', designation: 'President, Federated Student Council Organization, Inc. / Member', email: 'r.rivera@student.essu.edu.ph', isActive: true },
    { id: '13', name: 'HON. GERSHON G. ESCOTO, JR.', role: 'Member', designation: 'President, Federated Faculty Association / Member', email: 'g.escotojr@faculty.essu.edu.ph', isActive: true },
  ];

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('board_members_access');
    if (saved) {
      return JSON.parse(saved).filter((member: Member) => member.role !== 'Secretary');
    }
    return defaultMembers;
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('board_members_access', JSON.stringify(members));
  }, [members]);

  const toggleAccess = (id: string, isRep: boolean = false, parentId?: string) => {
    setMembers(prev => prev.map(m => {
      if (!isRep && m.id === id) {
        return { ...m, isActive: !m.isActive };
      }
      if (isRep && m.id === parentId && m.representative) {
        return {
          ...m,
          representative: { ...m.representative, isActive: !m.representative.isActive }
        };
      }
      return m;
    }));
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleStyles = (role: string, isActive: boolean) => {
    if (!isActive) return { icon: 'bg-slate-100 text-slate-400', badge: 'bg-slate-100 text-slate-500' };
    
    switch (role) {
      case 'Chair':
        return { icon: 'bg-sky-50 text-sky-600', badge: 'bg-sky-50 text-sky-600' };
      case 'Vice Chair':
        return { icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' };
      default:
        return { icon: 'bg-slate-50 text-slate-400', badge: 'bg-slate-100 text-slate-500' };
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Grant or revoke login portal access for Board Members</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none w-64 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMembers.map((member) => {
          const styles = getRoleStyles(member.role, member.isActive);
          
          return (
            <div key={member.id} className="space-y-3">
              <div className={`bg-white border rounded-2xl p-5 transition-all ${!member.isActive ? 'opacity-75 bg-slate-50/50' : 'border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${styles.icon}`}>
                      {member.isActive ? <Shield size={24} /> : <ShieldOff size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${member.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{member.name}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${styles.badge}`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{member.designation}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-sky-600">
                        <Mail size={12} />
                        <span className="text-xs font-medium">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAccess(member.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      member.isActive
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {member.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                    {member.isActive ? 'Remove Access' : 'Give Access'}
                  </button>
                </div>
              </div>

              {member.representative && (
                <div className="ml-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700">{member.representative.name}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Authorized Representative</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">{member.representative.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAccess(member.representative!.id, true, member.id)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                      member.representative.isActive
                        ? 'text-rose-500 hover:bg-rose-50'
                        : 'text-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    {member.representative.isActive ? 'Revoke Rep Access' : 'Allow Rep Access'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}