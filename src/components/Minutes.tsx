import { useState } from 'react';
import { FileText, Download, Eye, Calendar, Users, X, Search } from 'lucide-react';
import { mockMeetings, mockMembers } from '../data/mockData';

export default function Minutes() {
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  const meetingsWithMinutes = mockMeetings.filter(m => m.minutes);

  const filtered = meetingsWithMinutes.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const viewingMeeting = mockMeetings.find(m => m.id === viewing);

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getMemberNames(ids: string[]) {
    return ids.map(id => mockMembers.find(m => m.id === id)?.name).filter(Boolean).join(', ');
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Minutes</h1>
          <p className="text-slate-500 mt-1 text-sm">{meetingsWithMinutes.length} documents on file</p>
        </div>
      </div>

      {/* Search */}
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

      {/* Minutes List */}
      <div className="space-y-3">
        {filtered.map(meeting => (
          <div key={meeting.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-sky-100 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{meeting.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-slate-400" />
                      {formatDate(meeting.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={11} className="text-slate-400" />
                      {meeting.attendees.length} attendees
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 max-w-lg leading-relaxed">
                    {meeting.minutes?.substring(0, 160)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewing(meeting.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye size={13} />
                  View
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Download size={13} />
                  Export
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No minutes found</p>
            <p className="text-slate-400 text-sm mt-1">Minutes are recorded after meetings are completed</p>
          </div>
        )}
      </div>

      {/* Meetings pending minutes */}
      {(() => {
        const pending = mockMeetings.filter(m => m.status === 'completed' && !m.minutes);
        if (pending.length === 0) return null;
        return (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Pending Minutes</h2>
            <div className="space-y-2">
              {pending.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(m.date)}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">Draft Needed</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Minutes Viewer Modal */}
      {viewingMeeting?.minutes && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-slate-900">{viewingMeeting.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(viewingMeeting.date)} · {viewingMeeting.attendees.length} attendees</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Download size={13} />
                  Export
                </button>
                <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 p-1 ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 font-medium mb-1">Attendees</p>
                <p className="text-sm text-slate-700">{getMemberNames(viewingMeeting.attendees)}</p>
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                {viewingMeeting.minutes}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
