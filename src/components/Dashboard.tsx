import { useEffect, useState } from 'react';
import { Calendar, Users, FileText, Clock, BarChart3, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

interface DashboardProps {
  onNavigate: (page: 'meetings' | 'members' | 'minutes' | 'actions') => void;
}

interface Meeting {
  id: string;
  title: string;
  scheduled_date: string; 
  scheduled_time: string; 
  location: string;
  status: string;
}

interface ActionItem {
  id: string;
  description: string;
  status: string;
}

interface BoardMember {
  id: string;
  name: string;
  role: string;
  designation: string;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState([
    { label: 'Total Members', value: 0, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50/50', page: 'members' as const },
    { label: 'Upcoming Meetings', value: 0, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50/50', page: 'meetings' as const },
    { label: 'Minutes on File', value: 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50/50', page: 'minutes' as const },
    { label: 'Pending Actions', value: 0, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100/50', page: 'actions' as const },
  ]);

  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [pendingActionsList, setPendingActionsList] = useState<ActionItem[]>([]);
  const [previewMembers, setPreviewMembers] = useState<BoardMember[]>([]);

  const handleNavigation = (page: 'meetings' | 'members' | 'minutes' | 'actions') => {
    window.scrollTo(0, 0);
    onNavigate(page);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const { count: memberCount } = await supabase
          .from('board_members')
          .select('*', { count: 'exact', head: true });

        const { count: upcomingCount } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled');

        const { count: minutesCount } = await supabase
          .from('meeting_minutes')
          .select('*', { count: 'exact', head: true });

        const { count: pendingCount } = await supabase
          .from('action_items')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');

        setStats(prev => [
          { ...prev[0], value: memberCount || 0 },
          { ...prev[1], value: upcomingCount || 0 },
          { ...prev[2], value: minutesCount || 0 },
          { ...prev[3], value: pendingCount || 0 },
        ]);

        const { data: nextMeetingData } = await supabase
          .from('meetings')
          .select('*')
          .eq('status', 'scheduled')
          .order('scheduled_date', { ascending: true })
          .order('scheduled_time', { ascending: true })
          .limit(1);

        if (nextMeetingData && nextMeetingData.length > 0) {
          setNextMeeting(nextMeetingData[0]);
        } else {
          setNextMeeting(null);
        }

        const { data: recentMeetingsData } = await supabase
          .from('meetings')
          .select('*')
          .order('scheduled_date', { ascending: false })
          .limit(4);

        if (recentMeetingsData) {
          setRecentMeetings(recentMeetingsData);
        }

        const { data: actionsListData } = await supabase
          .from('action_items')
          .select('*')
          .eq('status', 'Pending');

        if (actionsListData) {
          setPendingActionsList(actionsListData);
        }

        const { data: liveMembersData } = await supabase
          .from('board_members')
          .select('id, name, role, designation')
          .in('role', ['Chair', 'Vice Chair', 'Secretary'])
          .limit(3);

        if (liveMembersData) {
          const roleOrder: Record<string, number> = { 'Chair': 1, 'Vice Chair': 2, 'Secretary': 3 };
          const sortedMembers = [...liveMembersData].sort((a, b) => 
            (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4)
          );
          setPreviewMembers(sortedMembers);
        }

      } catch (error) {
        console.error('Database connection error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }

  const getMeetingStatusBadge = (status: string) => {
    const normalized = status ? status.trim().toLowerCase() : '';
    switch (normalized) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress':
      case 'in progress': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  
  const getRoleBadgeStyle = (role: string) => {
    const normalized = role ? role.trim().toLowerCase() : '';
    switch (normalized) {
      case 'chair': 
        return 'bg-blue-100 text-blue-700 dark:bg-blue-100/80';
      case 'vice chair': 
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-100/80';
      case 'secretary': 
        return 'bg-purple-100 text-purple-700 dark:bg-purple-100/80';
      default: 
        return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-emerald-800 font-semibold animate-pulse text-sm tracking-wider">SYNCING DASHBOARD METRICS...</p>
      </div>
    );
  }

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
        <div className="lg:col-span-1 bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[220px]">
          {nextMeeting ? (
            <>
              <div className="bg-green-600 p-6 text-white flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-50 text-[10px] font-bold uppercase">Next Meeting</span>
                  <span className="bg-green-700/50 text-green-100 border border-green-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {nextMeeting.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1 truncate">{nextMeeting.title}</h3>
                <p className="text-green-50 text-sm">{formatDate(nextMeeting.scheduled_date)} at {formatTime(nextMeeting.scheduled_time)}</p>
              </div>
              <div className="p-6 bg-white">
                <div className="flex items-center gap-3 text-slate-600">
                  <BarChart3 size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium truncate">{nextMeeting.location || 'No Location Specified'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full w-full gap-2 my-auto">
              <Calendar size={32} className="text-slate-300" />
              <p className="text-sm text-slate-500 font-medium">No upcoming meetings scheduled.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-emerald-900 text-sm">Recent Meetings</h2>
            <button onClick={() => handleNavigation('meetings')} className="text-emerald-700 text-xs font-bold">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentMeetings.length > 0 ? (
              recentMeetings.map((meeting) => (
                <div key={meeting.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${meeting.status?.toLowerCase() === 'completed' ? 'bg-green-500' : meeting.status?.toLowerCase() === 'scheduled' ? 'bg-blue-500' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{meeting.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(meeting.scheduled_date)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getMeetingStatusBadge(meeting.status)}`}>
                    {(meeting.status || '').toUpperCase().replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">No recent meeting logs available.</div>
            )}
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
            {previewMembers.length > 0 ? (
              previewMembers.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                    {(member.name || 'B').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.designation || 'No Designation Listed'}</p>
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getRoleBadgeStyle(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">No key executives added yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-emerald-900 text-sm">Pending Action Items</h2>
            <button onClick={() => handleNavigation('actions')} className="text-emerald-700 text-xs font-bold">Manage</button>
          </div>
          <div className="p-2 max-h-[290px] overflow-y-auto divide-y divide-slate-50">
            {pendingActionsList.length > 0 ? (
              pendingActionsList.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <Clock size={18} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-800">{action.description}</p>
                  </div>
                  <AlertCircle size={18} className="text-amber-400 animate-pulse" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">All caught up! No pending action items.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}