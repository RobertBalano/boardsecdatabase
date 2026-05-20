import { Plus, BarChart3, Check, X, ChevronRight, Users, Trophy } from 'lucide-react';
import { useState } from 'react';

export default function Voting() {
  const [selectedBallotId, setSelectedBallotId] = useState<string | null>(null);

  const ballots = [
    {
      id: 'ballot-1',
      title: 'Board Chair Election 2026',
      description: 'Annual election for the position of Board Chair.',
      status: 'closed',
      totalMembers: 12,
      results: [
        { name: 'CANDIDATE 1', role: 'Chair', votes: 8, isWinner: true },
        { name: 'CANDIDATE 2', role: 'Vice Chair', votes: 4, isWinner: false },
      ]
    },
    {
      id: 'ballot-2',
      title: 'Approve Strategic Plan 2026-2028',
      description: 'Vote to ratify the three-year strategic plan as presented.',
      status: 'active',
      totalMembers: 12,
      currentVotes: 10,
      stats: {
        yes: { count: 7, percent: 70 },
        no: { count: 2, percent: 20 },
        abstain: { count: 1, percent: 10 }
      }
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voting & Polling</h1>
          <p className="text-slate-500 mt-1 text-sm">1 active · 12 Total Board Members</p>
        </div>
        <button className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
          <Plus size={18} />
          New Ballot
        </button>
      </div>

      <div className="grid gap-4">
        {ballots.map((ballot) => {
          const isExpanded = selectedBallotId === ballot.id;
          const isActive = ballot.status === 'active';

          return (
            <div 
              key={ballot.id} 
              className={`bg-white border rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
                isExpanded ? 'border-sky-200 ring-4 ring-sky-50' : 'border-slate-100 hover:border-slate-200 shadow-sm'
              }`}
              onClick={() => setSelectedBallotId(isExpanded ? null : ballot.id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{ballot.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{ballot.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {ballot.status}
                    </span>
                    <ChevronRight size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-8 pt-6 border-t border-slate-50 space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>{isActive ? 'Live Standings' : 'Final Results'}</span>
                      <div className="flex items-center gap-1.5">
                        <Users size={14} />
                        <span>{isActive ? `${ballot.currentVotes} / ${ballot.totalMembers}` : `${ballot.totalMembers} / ${ballot.totalMembers}`} Members Voted</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!isActive && ballot.results?.map((candidate) => (
                        <div key={candidate.name} className="space-y-2 p-3 rounded-xl border border-slate-50 bg-slate-50/50">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-800">{candidate.name}</span>
                              {candidate.isWinner && (
                                <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  <Trophy size={10} /> WINNER
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-slate-600">{candidate.votes} votes</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${candidate.isWinner ? 'bg-emerald-500' : 'bg-slate-400'}`}
                              style={{ width: `${(candidate.votes / ballot.totalMembers) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {isActive && (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-slate-700 flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Yes</span>
                              <span className="text-slate-500">{ballot.stats?.yes.count} votes ({ballot.stats?.yes.percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${ballot.stats?.yes.percent}%` }} />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-slate-700 flex items-center gap-2"><X size={16} className="text-rose-500" /> No</span>
                              <span className="text-slate-500">{ballot.stats?.no.count} votes ({ballot.stats?.no.percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${ballot.stats?.no.percent}%` }} />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-semibold text-slate-700 flex items-center gap-2"><Users size={16} className="text-slate-400" /> Abstain</span>
                              <span className="text-slate-500">{ballot.stats?.abstain.count} votes ({ballot.stats?.abstain.percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-300" style={{ width: `${ballot.stats?.abstain.percent}%` }} />
                            </div>
                          </div>
                          
                          
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}