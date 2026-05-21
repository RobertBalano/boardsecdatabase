import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Calendar, MapPin, Users, ChevronRight, Clock, X,
  Upload, Edit2, Eye, Pencil, FileText, Play, CheckCircle, Save
} from 'lucide-react';
import { supabase } from '../supabaseClient'; 

type FrontendStatus = 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: FrontendStatus;
  attendee_count?: number; 
  estimated_duration_min?: number;
  agenda_name?: string;
}

const TO_DB_STATUS: Record<FrontendStatus, string> = {
  'Scheduled': 'scheduled',
  'In-Progress': 'in_progress',
  'Completed': 'completed',
  'Cancelled': 'cancelled'
};

const FROM_DB_STATUS: Record<string, FrontendStatus> = {
  'scheduled': 'Scheduled',
  'in_progress': 'In-Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null); 
  

  const [editingAttendeeCount, setEditingAttendeeCount] = useState<string>('0');
  const [updatingCount, setUpdatingCount] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    duration: '60',
    agendaName: ''
  });

  
  useEffect(() => {
    if (selected) {
      setEditingAttendeeCount(String(selected.attendee_count ?? 0));
    }
  }, [selected]);

  useEffect(() => {
    async function getMeetings() {
      setLoading(true);
      try {
        let query = supabase
          .from('meetings')
          .select('id, title, scheduled_date, scheduled_time, location, status, attendee_count, estimated_duration_min, agenda_name')
          .order('scheduled_date', { ascending: false });

        if (filterStatus !== 'all') {
          const dbFilterValue = filterStatus === 'in-progress' ? 'in_progress' : filterStatus;
          query = query.eq('status', dbFilterValue);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          const mappedMeetings: Meeting[] = data.map((m: any) => ({
            id: m.id,
            title: m.title,
            date: m.scheduled_date,
            time: m.scheduled_time,
            location: m.location,
            status: FROM_DB_STATUS[m.status] ?? 'Scheduled', 
            attendee_count: m.attendee_count,
            estimated_duration_min: m.estimated_duration_min,
            agenda_name: m.agenda_name || ''
          }));
          setMeetings(mappedMeetings);

          if (selected) {
            const currentSelected = mappedMeetings.find(item => item.id === selected.id);
            if (currentSelected) setSelected(currentSelected);
          }
        }
      } catch (err) {
        console.error('Error fetching meetings from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    getMeetings();
  }, [filterStatus]);

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      'Scheduled': 'bg-sky-50 text-sky-600 border-sky-100',
      'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'In-Progress': 'bg-amber-50 text-amber-600 border-amber-100',
      'Cancelled': 'bg-rose-50 text-rose-500 border-rose-100',
    };
    return map[status] ?? 'bg-slate-100 text-slate-500';
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!e.target.files || !e.target.files[0]) return;

      const file = e.target.files[0];
      const fileName = `${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from('meeting-agendas')
        .upload(fileName, file);

      if (error) throw error;

      setForm(p => ({
        ...p,
        agendaName: data.path
      }));

    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Upload Error: ${err.message}`);
    }
  }
  
  function handleViewDocument(filePath: string) {
    if (!filePath) return;

    const { data } = supabase.storage
      .from('meeting-agendas')
      .getPublicUrl(filePath);

    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      alert('Unable to open document.');
    }
  }

  async function updateMeetingStatus(meetingId: string, newStatus: FrontendStatus) {
    try {
      const dbStatusValue = TO_DB_STATUS[newStatus];

      const { data, error } = await supabase
        .from('meetings')
        .update({ status: dbStatusValue }) 
        .eq('id', meetingId)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const updated = data[0];
        
        const updatedMeeting: Meeting = {
          id: updated.id,
          title: updated.title,
          date: updated.scheduled_date,
          time: updated.scheduled_time,
          location: updated.location,
          status: newStatus, 
          attendee_count: updated.attendee_count,
          estimated_duration_min: updated.estimated_duration_min,
          agenda_name: updated.agenda_name || ''
        };

        setMeetings(prev => prev.map(m => m.id === meetingId ? updatedMeeting : m));
        setSelected(updatedMeeting);
      }
    } catch (err: any) {
      console.error('Error changing meeting status:', err);
      alert(`Status Update Error: ${err.message || 'Unknown error'}`);
    }
  }

  
  async function handleUpdateAttendeeCount() {
    if (!selected) return;
    setUpdatingCount(true);
    try {
      const parsedCount = parseInt(editingAttendeeCount) || 0;

      const { data, error } = await supabase
        .from('meetings')
        .update({ attendee_count: parsedCount })
        .eq('id', selected.id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const updated = data[0];
        const updatedMeeting: Meeting = {
          ...selected,
          ...updated,
          status: selected.status 
        };

        setMeetings(prev => prev.map(m => m.id === selected.id ? updatedMeeting : m));
        setSelected(updatedMeeting);
        alert('Attendee count updated!');
      }
    } catch (err: any) {
      console.error('Error saving attendee count:', err);
      alert(`Failed to update attendee count: ${err.message}`);
    } finally {
      setUpdatingCount(false);
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const rawUiStatus: FrontendStatus = isEditing ? (selected?.status ?? 'Scheduled') : 'Scheduled';
      const dbStatusValue = TO_DB_STATUS[rawUiStatus];

      const targetPayload = {
        title: form.title,
        scheduled_date: form.date,
        scheduled_time: form.time,
        location: form.location,
        status: dbStatusValue, 
        attendee_count: selected?.attendee_count ?? 0,
        estimated_duration_min: parseInt(form.duration) || 60,
        agenda_name: form.agendaName
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from('meetings')
          .update(targetPayload)
          .eq('id', isEditing)
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const updated = data[0];
          const updatedMeeting: Meeting = {
            id: updated.id,
            title: updated.title,
            date: updated.scheduled_date,
            time: updated.scheduled_time,
            location: updated.location,
            status: FROM_DB_STATUS[updated.status] ?? 'Scheduled',
            attendee_count: updated.attendee_count,
            estimated_duration_min: updated.estimated_duration_min,
            agenda_name: updated.agenda_name || ''
          };

          setMeetings(prev => prev.map(m => m.id === isEditing ? updatedMeeting : m));
          setSelected(null);
        }
      } else {
        const { data, error } = await supabase
          .from('meetings')
          .insert([targetPayload])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const created = data[0];
          const newMeeting: Meeting = {
            id: created.id,
            title: created.title,
            date: created.scheduled_date,
            time: created.scheduled_time,
            location: created.location,
            status: FROM_DB_STATUS[created.status] ?? 'Scheduled',
            attendee_count: created.attendee_count,
            estimated_duration_min: created.estimated_duration_min,
            agenda_name: created.agenda_name || ''
          };
          setMeetings(prev => [newMeeting, ...prev]);
        }
      }

      setForm({ title: '', date: '', time: '', location: '', duration: '60', agendaName: '' });
      setIsEditing(null);
      setShowForm(false);
    } catch (err: any) {
      console.error('Error executing database write:', err);
      alert(`Database Error: ${err.message || err.details || 'Unknown error'}`);
    }
  }

  function openEditMode(meeting: Meeting) {
    setIsEditing(meeting.id);
    setForm({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      duration: String(meeting.estimated_duration_min ?? 60),
      agendaName: meeting.agenda_name || ''
    });
    setShowForm(true);
  }

  return (
    <div className="p-8">
     
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
          <p className="text-slate-500 mt-1 text-sm">{meetings.length} total meetings</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(null);
            setForm({ title: '', date: '', time: '', location: '', duration: '60', agendaName: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Plus size={16} />
          New Meeting
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-400 italic">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 italic">No meetings found.</div>
        ) : (
          meetings.map(meeting => (
            <div
              key={meeting.id}
              onClick={() => setSelected(meeting)}
              className="bg-white border border-slate-100 rounded-xl p-5 cursor-pointer hover:border-sky-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{meeting.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(meeting.date)} at {meeting.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400" />
                      {meeting.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={12} className="text-slate-400" />
                      {meeting.attendee_count ?? 0} attendees
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />
                      {meeting.estimated_duration_min ?? 0} min estimated
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-400 transition-colors mt-0.5 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-slate-900">{selected.title}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openEditMode(selected)}
                  className="flex items-center gap-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil size={13} />
                  Edit Details
                </button>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-600">
               <p><strong>Location:</strong> {selected.location}</p>
               <p><strong>Time:</strong> {formatDate(selected.date)} @ {selected.time}</p>
               <p><strong>Duration:</strong> {selected.estimated_duration_min ?? 0} minutes</p>
               <p><strong>Total Attendees:</strong> {selected.attendee_count ?? 0}</p>
               
               <div className="border-t border-slate-100 pt-4">
                 <strong className="block text-slate-700 mb-2">Agenda Documentation:</strong>
                 {selected.agenda_name ? (
                   <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                     <span className="flex items-center gap-2 max-w-[80%] truncate">
                       <FileText size={14} className="text-slate-400 flex-shrink-0" />
                       <span className="truncate">{selected.agenda_name.split('-').slice(1).join('-') || selected.agenda_name}</span>
                     </span>
                     <div className="flex gap-1">
                       <button 
                         onClick={() => handleViewDocument(selected.agenda_name || '')}
                         className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all flex items-center gap-1" 
                         title="View Document"
                       >
                         <Eye size={14} />
                         <span>View</span>
                       </button>
                     </div>
                   </div>
                 ) : (
                   <span className="text-slate-400 italic">No agenda uploaded or attached.</span>
                 )}
               </div>

               <div className="border-t border-slate-100 pt-4">
                 <strong className="block text-slate-700 mb-2 font-semibold">Update Meeting Status:</strong>
                 <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                   
                   <div className="flex flex-wrap items-center gap-3 flex-1">
                     <span className="text-slate-700 font-medium whitespace-nowrap">
                       {selected.status === 'In-Progress' && 'Meeting currently ongoing.'}
                       {selected.status === 'Completed' && 'Meeting concluded.'}
                       {selected.status === 'Cancelled' && 'Meeting cancelled.'}
                     </span>

                     {selected.status === 'Completed' && (
                       <div className="flex items-center gap-1.5 ml-2 border-l border-slate-300 pl-3">
                         <span className="text-slate-500 text-[11px]">Attendees:</span>
                         <input 
                           type="number"
                           min="0"
                           value={editingAttendeeCount}
                           onChange={(e) => setEditingAttendeeCount(e.target.value)}
                           className="w-16 border border-slate-200 rounded px-2 py-1 text-xs text-center font-medium bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition"
                         />
                         <button
                           type="button"
                           disabled={updatingCount}
                           onClick={handleUpdateAttendeeCount}
                           className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded transition-colors flex items-center justify-center"
                           title="Save Attendees"
                         >
                           <Save size={12} />
                         </button>
                       </div>
                     )}
                   </div>

                   <div className="flex items-center gap-2.5 flex-shrink-0">
                     {(selected.status === 'Scheduled' || selected.status === 'In-Progress') && (
                       <button
                         onClick={() => {
                           if (confirm('Are you sure you want to cancel this meeting session?')) {
                             updateMeetingStatus(selected.id, 'Cancelled');
                           }
                         }}
                         className="text-slate-400 hover:text-rose-500 font-medium transition-colors text-xs px-2.5 py-2 rounded-lg hover:bg-rose-50/50"
                       >
                         Cancel Meeting
                       </button>
                     )}

                     {selected.status === 'Scheduled' && (
                       <button
                         onClick={() => updateMeetingStatus(selected.id, 'In-Progress')}
                         className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm shadow-amber-100"
                       >
                         <Play size={13} fill="currentColor" />
                         Start Meeting
                       </button>
                     )}

                     {selected.status === 'In-Progress' && (
                       <button
                         onClick={() => updateMeetingStatus(selected.id, 'Completed')}
                         className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm shadow-emerald-100"
                       >
                         <CheckCircle size={13} />
                         End Meeting
                       </button>
                     )}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{isEditing ? 'Update Meeting Details' : 'Schedule Meeting'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Meeting Title</label>
                <select
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition bg-white"
                >
                  <option value="" disabled>Select Meeting Type</option>
                  <optgroup label="Board Meetings: Regular">
                    <option value="1st Quarter Board Meeting">1st Quarter Board Meeting</option>
                    <option value="2nd Quarter Board Meeting">2nd Quarter Board Meeting</option>
                    <option value="3rd Quarter Board Meeting">3rd Quarter Board Meeting</option>
                    <option value="4th Quarter Board Meeting">4th Quarter Board Meeting</option>
                  </optgroup>
                  <optgroup label="Board Meetings: Special">
                    <option value="1st Special Board Meeting">1st Special Board Meeting</option>
                    <option value="2nd Special Board Meeting">2nd Special Board Meeting</option>
                  </optgroup>
                  <optgroup label="BOR-Committee Meetings">
                    <option value="Finance Committee Meeting">Finance Committee Meeting</option>
                    <option value="Administrative and Program Standards Committee Meeting">Administrative and Program Standards Committee Meeting</option>
                    <option value="Joint Committee Meeting">Joint Committee Meeting</option>
                  </optgroup>
                  <optgroup label="Council Meetings">
                    <option value="Academic Council Meeting">Academic Council Meeting</option>
                    <option value="Administrative Council Meeting">Administrative Council Meeting</option>
                    <option value="Joint Council Meeting">Joint Council Meeting</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Time</label>
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Location</label>
                  <input
                    required
                    type="text"
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Boardroom A"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Estimate Minutes</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                    placeholder="e.g. 45"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Meeting Agenda Document</label>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                  <span className="text-xs text-slate-500 italic max-w-[260px] truncate">
                    {form.agendaName ? form.agendaName.split('-').slice(1).join('-') : 'No agenda attached yet'}
                  </span>
                  <div className="flex gap-2">
                    {!form.agendaName ? (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
                        title="Upload Agenda File"
                      >
                        <Upload size={16} />
                      </button>
                    ) : (
                      <>
                        {isEditing ? (
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
                            title="Replace File"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors"
                            title="Change Selected File"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100">
                  {isEditing ? 'Save Changes' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}