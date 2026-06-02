import { useState, useEffect } from 'react';
import { Plus, BarChart3, X, ChevronRight, Users, Trophy } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

interface BallotOptionStat {
  name: string;
  votes: number;
  percent: number;
  isWinner: boolean;
}

interface BallotData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed';
  totalMembers: number;
  currentVotes: number;
  results: BallotOptionStat[];
}

export default function Voting() {
  
  const [ballots, setBallots] = useState<BallotData[]>([]);
  const [selectedBallotId, setSelectedBallotId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchBallotsWithStats();
  }, []);

  
  const fetchBallotsWithStats = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const { data: ballotsData, error: ballotErr } = await supabase
        .from('ballots')
        .select('*')
        .order('created_at', { ascending: false });

      if (ballotErr) throw ballotErr;

      
      const { data: standingsData, error: standingsErr } = await supabase
        .from('v_ballot_standings')
        .select('*');

      if (standingsErr) throw standingsErr;

      
      const formattedBallots: BallotData[] = (ballotsData || []).map(ballot => {
        const optionsForBallot = (standingsData || []).filter(s => s.ballot_id === ballot.id);
        const totalVotes = optionsForBallot[0]?.total_votes_cast || 0;

        const resultsArray: BallotOptionStat[] = optionsForBallot.map(o => ({
          name: o.option_text,
          votes: o.vote_count,
          percent: o.percentage || 0,
          isWinner: o.is_winner
        }));

        return {
          id: ballot.id,
          title: ballot.title,
          description: ballot.description || '',
          status: ballot.status,
          totalMembers: ballot.total_members,
          currentVotes: totalVotes,
          results: resultsArray
        };
      });

      setBallots(formattedBallots);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching ballot records.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleCreateBallotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    const validOptions = formOptions.filter(opt => opt.trim() !== '');

    if (!formTitle.trim() || validOptions.length < 2) {
      alert('Please fill out the title and provide at least 2 voting choices.');
      return;
    }

    try {
      setSubmitting(true);

      
      const { data: ballot, error: bError } = await supabase
        .from('ballots')
        .insert([{ 
          title: formTitle.trim(), 
          description: formDescription.trim(), 
          status: 'active', 
          total_members: 11 
        }])
        .select()
        .single();

      if (bError) throw bError;

      
      const optionsToInsert = validOptions.map(choice => ({
        ballot_id: ballot.id,
        option_text: choice.trim()
      }));

      
      const { error: optError } = await supabase
        .from('ballot_options')
        .insert(optionsToInsert);

      if (optError) throw optError;

      
      setFormTitle('');
      setFormDescription('');
      setFormOptions(['', '']);
      setShowModal(false);
      
      
      fetchBallotsWithStats();
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving your ballot configuration.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleOptionChange = (index: number, value: string) => {
    const updated = [...formOptions];
    updated[index] = value;
    setFormOptions(updated);
  };

  const addOptionField = () => setFormOptions([...formOptions, '']);
  const removeOptionField = (index: number) => {
    if (formOptions.length <= 2) return;
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
    
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voting & Polling</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {loading ? 'Syncing active statuses...' : `${ballots.filter(b => b.status === 'active').length} active · 11 Total Board Members`}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-sky-100"
        >
          <Plus size={18} />
          New Ballot
        </button>
      </div>

      {error && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">{error}</div>}

    
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading active ballot registers...</div>
      ) : (
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
                        {ballot.description && <p className="text-sm text-slate-500 mt-1">{ballot.description}</p>}
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
                    <div className="mt-8 pt-6 border-t border-slate-50 space-y-6">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>{isActive ? 'Live Standings' : 'Final Results'}</span>
                        <div className="flex items-center gap-1.5">
                          <Users size={14} />
                          <span>
                            {isActive ? `${ballot.currentVotes} / ${ballot.totalMembers}` : `${ballot.totalMembers} / ${ballot.totalMembers}`} Members Voted
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {ballot.results.map((choice) => (
                          <div key={choice.name} className="space-y-2 p-3 rounded-xl border border-slate-50 bg-slate-50/50">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-800">{choice.name}</span>
                                {!isActive && choice.isWinner && (
                                  <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    <Trophy size={10} /> WINNER
                                  </span>
                                )}
                              </div>
                              <span className="font-medium text-slate-600">{choice.votes} votes ({choice.percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  !isActive && choice.isWinner ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${choice.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900">Create New Ballot</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            
            <form className="p-6 space-y-4 overflow-y-auto flex-1" onSubmit={handleCreateBallotSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Ballot / Poll Title</label>
                <input 
                  type="text" 
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Board Chair Election 2026 or Strategic Plan Approval" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide context regarding this vote..." 
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition" 
                />
              </div>

              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Manual Options / Candidates</label>
                <p className="text-[11px] text-slate-400">Type manual alternatives like "Yes", "No" or actual candidate names.</p>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="text"
                        required={idx < 2} 
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                      {formOptions.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => removeOptionField(idx)}
                          className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addOptionField}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 mt-1"
                >
                  <Plus size={14} /> Add option choice
                </button>
              </div>

              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  disabled={submitting} 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 font-bold"
                >
                  {submitting ? 'Creating...' : 'Deploy Ballot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}