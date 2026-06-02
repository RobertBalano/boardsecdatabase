import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, XCircle, ChevronRight, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface WorkflowItem {
  id: string;
  title: string;
  description: string;
  initiated_by: string;
  status: 'pending' | 'approved' | 'cancelled';
  created_at: string;
  votes?: VoteItem[];
}

interface VoteItem {
  member_name: string;
  vote_status: 'pending' | 'approved' | 'cancelled';
}

interface DBBoardMember {
  id: string;
  name: string;
  role: string;
}

export default function LiveWorkflowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [dbBoardMembers, setDbBoardMembers] = useState<DBBoardMember[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<WorkflowItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', initiated_by: '' });

  // Filter out secretaries from voting power rosters
  const activeVotingMembers = dbBoardMembers.filter(m => m.role !== 'secretary');
  const majorityRequirement = Math.floor(activeVotingMembers.length / 2) + 1;

  // 1. Fetch Dynamic Board Members lists from database
  const fetchBoardMembers = async () => {
    const { data, error } = await supabase
      .from('board_members')
      .select('id, name, role');
    if (!error && data) {
      setDbBoardMembers(data as DBBoardMember[]);
    }
  };

  // 2. Fetch workflows and sync open modal references safely
  const fetchWorkflows = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select(`*, votes:workflow_votes(member_name, vote_status)`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWorkflows(data as WorkflowItem[]);
    }
  };

  // Keep modal view fresh when real-time updates modify background tallies
  useEffect(() => {
    if (selected) {
      const freshData = workflows.find(w => w.id === selected.id);
      if (freshData) {
        setSelected(freshData);
      }
    }
  }, [workflows]);

  // 3. Setup Live Realtime Listeners on Mount
  useEffect(() => {
    fetchBoardMembers();
    fetchWorkflows();

    const channel = supabase
      .channel('live-board-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflows' }, () => { fetchWorkflows(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workflow_votes' }, () => { fetchWorkflows(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty array ensures closure event values don't collide loops

  // 4. Handle Form Submission with dynamic voter seeding rules
  const handleAddWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.initiated_by) return;

    if (activeVotingMembers.length === 0) {
      alert("Error: No voting board members found in your database table. Please seed the database table first.");
      return;
    }

    // Step A: Insert workflow row
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .insert([{
        title: form.title,
        description: form.description,
        initiated_by: form.initiated_by,
        status: 'pending'
      }])
      .select()
      .single();

    if (workflowError) {
      console.error("Supabase Workflow Insert Error:", workflowError.message);
      alert(`Failed to save workflow: ${workflowError.message}`);
      return;
    }

    // Step B: Seed voting entries skipping structural Secretary entries
    const initialVotes = activeVotingMembers.map(member => ({
      workflow_id: workflowData.id,
      member_name: member.name,
      vote_status: 'pending'
    }));

    const { error: votesError } = await supabase.from('workflow_votes').insert(initialVotes);

    if (votesError) {
      console.error("Supabase Seeding Votes Error:", votesError.message);
      alert(`Workflow created, but failed to initialize board votes: ${votesError.message}`);
      return;
    }

    setForm({ title: '', description: '', initiated_by: '' });
    setShowForm(false);
    fetchWorkflows();
  };

  const filtered = filterStatus === 'all' ? workflows : workflows.filter(w => w.status === filterStatus);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow & Approvals</h1>
          <p className="text-slate-500 mt-1 text-sm">{workflows.length} total workflows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Workflows Stack */}
      <div className="space-y-3">
        {filtered.map(workflow => {
          const totalVotesCast = workflow.votes?.filter(v => v.vote_status !== 'pending').length || 0;
          const maxPossibleVotes = workflow.votes?.length || activeVotingMembers.length || 11;
          const statusColor =
            workflow.status === 'approved' ? 'text-emerald-500 bg-emerald-50' : workflow.status === 'cancelled' ? 'text-rose-500 bg-rose-50' : 'text-amber-500 bg-amber-50';

          return (
            <div
              key={workflow.id}
              onClick={() => setSelected(workflow)}
              className="bg-white border border-slate-100 rounded-xl p-5 cursor-pointer hover:border-sky-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{workflow.title}</h3>
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                      {workflow.status === 'approved' && <CheckCircle2 size={12} />}
                      {workflow.status === 'cancelled' && <XCircle size={12} />}
                      {workflow.status === 'pending' && <Clock size={12} />}
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{workflow.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Initiated by <b>{workflow.initiated_by}</b></span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      Live Tally: {totalVotesCast} / {maxPossibleVotes} voted
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-400 mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Detail Panel Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-500 mt-1">Initiated by {selected.initiated_by}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Vote Metrics Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-slate-400">Approved</p>
                  <p className="text-lg font-bold text-emerald-600">{selected.votes?.filter(v => v.vote_status === 'approved').length || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-slate-400">Cancelled</p>
                  <p className="text-lg font-bold text-rose-600">{selected.votes?.filter(v => v.vote_status === 'cancelled').length || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium text-slate-400">Awaiting</p>
                  <p className="text-lg font-bold text-amber-600">{selected.votes?.filter(v => v.vote_status === 'pending').length || 0}</p>
                </div>
              </div>

              {/* Dynamic Live List of Board Room Ballots */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  Voter Ledger (Requires {selected.votes ? Math.floor(selected.votes.length / 2) + 1 : majorityRequirement} for Majority decision)
                </p>
                <div className="space-y-2">
                  {selected.votes?.map(vote => (
                    <div key={vote.member_name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-800">{vote.member_name}</span>
                      <div className="flex items-center gap-1.5">
                        {vote.vote_status === 'approved' && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Approved</span>}
                        {vote.vote_status === 'cancelled' && <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">Cancelled</span>}
                        {vote.vote_status === 'pending' && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Pending</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Workflow Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-lg">New Workflow Configuration</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Workflow Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual Budget Review"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe details regarding this ledger item..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Initiated By</label>
                <input
                  required
                  type="text"
                  value={form.initiated_by}
                  onChange={e => setForm(p => ({ ...p, initiated_by: e.target.value }))}
                  placeholder="Insert Name"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
              </div>
              <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200 font-medium">
                * All {activeVotingMembers.length || 0} active board members will be initialized automatically as reviewers for this workflow request (Excluding Secretary).
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}