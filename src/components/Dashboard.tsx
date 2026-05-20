import { Calendar, Users, FileText, Clock, BarChart3, AlertCircle } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: 'meetings' | 'members' | 'minutes' | 'actions') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const handleNavigation = (page: 'meetings' | 'members' | 'minutes' | 'actions') => {
    window.scrollTo(0, 0);
    onNavigate(page);
  };

  const recentMeetings = [
    { id: '1', title: 'Q2 2026 Board Meeting', date: '2026-05-15', status: 'Scheduled' },
    { id: '2', title: 'Q1 2026 Board Meeting', date: '2026-02-20', status: 'Completed' },
    { id: '3', title: 'Emergency Board Session', date: '2026-04-03', status: 'Completed' },
    { id: '4', title: 'Q3 2026 Board Meeting', date: '2026-08-20', status: 'Scheduled' },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const mockMembers = [
    { 
      id: '1', 
      name: 'HON. DESIDERIO R. APAG III', 
      role: 'Chair', 
      designation: 'Commissioner, CHED', 
      avatar: '/desiderio.jpg' 
    },
    { 
      id: '2', 
      name: 'HON. ANDRES C. PAGATPATAN, JR.', 
      role: 'Vice Chair', 
      designation: 'President, ESSU', 
      avatar: '' 
    },
    { 
      id: '3', 
      name: 'SENATOR LOREN B. LEGARDA', 
      role: 'Member', 
      designation: 'Chairperson, Senate Committee...', 
      avatar: '' 
    },
  ];

  const upcomingMeeting = {
    title: 'Q2 2026 Board Meeting',
    date: '2026-05-15',
    time: '10:00 AM',
    location: 'Boardroom A, HQ',
    status: 'Scheduled',
  };

  const pendingActions = [{ id: '1', description: 'Prepare Q2 financial projections' }];

  const stats = [
    { label: 'Total Members', value: 12, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50/50', page: 'members' as const },
    { label: 'Upcoming Meetings', value: 2, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50/50', page: 'meetings' as const },
    { label: 'Minutes on File', value: 2, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50/50', page: 'minutes' as const },
    { label: 'Pending Actions', value: 1, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100/50', page: 'actions' as const },
  ];

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  const getMeetingStatusBadge = (status: string) => 
    status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';

  const getRoleBadge = (role: string) => {
    if (role === 'Chair') return 'bg-sky-100 text-sky-700';
    if (role === 'Vice Chair') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Dashboard</h1>
        <p className="text-emerald-700/70 mt-1 text-sm font-medium">Welcome back, Secretary. Here's your board overview.</p>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg, page }) => (
          <button key={label} onClick={() => handleNavigation(page)} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
              </div>
              <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-50 text-[10px] font-bold uppercase">Next Meeting</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">{upcomingMeeting.status}</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{upcomingMeeting.title}</h3>
            <p className="text-green-50 text-sm">{formatDate(upcomingMeeting.date)} at {upcomingMeeting.time}</p>
          </div>
          <div className="p-6">
             <div className="flex items-center gap-3 text-slate-600 mb-4">
                <BarChart3 size={16} className="text-emerald-600" />
                <span className="text-sm font-medium">{upcomingMeeting.location}</span>
             </div>
             <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Agenda Items</p>
                <p className="text-sm font-semibold text-slate-700">6 items</p>
             </div>
          </div>
        </div>

        
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-emerald-900 text-sm">Recent Meetings</h2>
            <button onClick={() => handleNavigation('meetings')} className="text-emerald-700 text-xs font-bold">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentMeetings.map((meeting) => (
              <div key={meeting.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${meeting.status === 'Completed' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(meeting.date)}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${getMeetingStatusBadge(meeting.status)}`}>
                  {meeting.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-emerald-900 text-sm">Board Members Preview</h2>
              <button onClick={() => handleNavigation('members')} className="text-emerald-700 text-xs font-bold">View all</button>
            </div>
            <div className="divide-y divide-slate-50">
              {mockMembers.slice(0, 3).map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden border border-slate-200">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.designation}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getRoleBadge(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
         </div>

         
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-emerald-900 text-sm">Pending Action Items</h2>
              <button onClick={() => handleNavigation('actions')} className="text-emerald-700 text-xs font-bold">Manage</button>
            </div>
            <div className="p-2">
              {pendingActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <Clock size={18} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-800">{action.description}</p>
                  </div>
                  <AlertCircle size={18} className="text-slate-300" />
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}