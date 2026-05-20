import { useState } from 'react';
import { Plus, CheckCircle2, Clock, XCircle, ChevronRight, X, Calendar } from 'lucide-react';
import { ApprovalWorkflow } from '../types';
import { mockApprovals, mockMembers } from '../data/mockData';

export default function Workflow() {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(mockApprovals);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<ApprovalWorkflow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', approvers: [] as string[] });

  const filtered = filterStatus === 'all' ? workflows : workflows.filter(w => w.status === filterStatus);

  function getMemberName(id: string) {
    return mockMembers.find(m => m.id === id)?.name ?? 'Unknown';
  }

  function getApprovalStatus(workflow: ApprovalWorkflow) {
    const approved = workflow.approvals.filter(a => a.status === 'approved').length;
    const rejected = workflow.approvals.filter(a => a.status === 'rejected').length;
    if (rejected > 0) return 'rejected';
    if (approved === workflow.approvals.length) return 'approved';
    return 'pending';
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function handleApprove(workflowId: string, memberId: string) {
    setWorkflows(prev =>
      prev.map(w =>
        w.id === workflowId
          ? {
              ...w,
              approvals: w.approvals.map(a =>
                a.memberId === memberId ? { ...a, status: 'approved', date: new Date().toISOString().split('T')[0] } : a
              ),
            }
          : w
      )
    );
  }

  function handleReject(workflowId: string, memberId: string) {
    setWorkflows(prev =>
      prev.map(w =>
        w.id === workflowId
          ? {
              ...w,
              approvals: w.approvals.map(a =>
                a.memberId === memberId ? { ...a, status: 'rejected', date: new Date().toISOString().split('T')[0] } : a
              ),
            }
          : w
      )
    );
  }

  function handleAddWorkflow(e: React.FormEvent) {
    e.preventDefault();
    const newWorkflow: ApprovalWorkflow = {
      id: String(Date.now()),
      title: form.title,
      description: form.description,
      initiator: '3',
      status: 'draft',
      approvers: form.approvers,
      approvals: form.approvers.map(id => ({ memberId: id, status: 'pending' })),
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setWorkflows(prev => [newWorkflow, ...prev]);
    setForm({ title: '', description: '', approvers: [] });
    setShowForm(false);
  }

  function toggleApprover(id: string) {
    setForm(prev => ({
      ...prev,
      approvers: prev.approvers.includes(id) ? prev.approvers.filter(a => a !== id) : [...prev.approvers, id],
    }));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow & Approvals</h1>
          <p className="text-slate-500 mt-1 text-sm">{workflows.length} total workflows</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-sky-100"
        >
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'submitted', 'approved', 'rejected'].map(f => (
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

      {/* Workflows List */}
      <div className="space-y-3">
        {filtered.map(workflow => {
          const status = getApprovalStatus(workflow);
          const statusColor =
            status === 'approved' ? 'text-emerald-500 bg-emerald-50' : status === 'rejected' ? 'text-rose-500 bg-rose-50' : 'text-amber-500 bg-amber-50';

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
                      {status === 'approved' && <CheckCircle2 size={12} />}
                      {status === 'rejected' && <XCircle size={12} />}
                      {status === 'pending' && <Clock size={12} />}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{workflow.description}</p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    <span>Initiated by {getMemberName(workflow.initiator)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due {formatDate(workflow.dueDate)}
                    </span>
                    <span>
                      {workflow.approvals.filter(a => a.status === 'approved').length}/{workflow.approvals.length} approved
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-400 transition-colors mt-0.5 flex-shrink-0" />
              </div>

              {/* Approval avatars */}
              <div className="mt-3 flex items-center gap-1.5">
                {workflow.approvals.slice(0, 5).map(approval => {
                  const member = mockMembers.find(m => m.id === approval.memberId);
                  if (!member) return null;
                  return (
                    <div key={approval.memberId} className="relative group/avatar">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className={`w-6 h-6 rounded-full object-cover border-2 ${
                          approval.status === 'approved' ? 'border-emerald-400' : approval.status === 'rejected' ? 'border-rose-400' : 'border-slate-300'
                        }`}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </div>
                    </div>
                  );
                })}
                {workflow.approvals.length > 5 && <span className="text-xs text-slate-400 px-1">+{workflow.approvals.length - 5}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-end p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Overview */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Status</p>
                  <p className="text-sm font-semibold text-slate-800">{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
                  <p className="text-sm font-semibold text-slate-800">{formatDate(selected.dueDate)}</p>
                </div>
              </div>

              {/* Initiator */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Initiated By</p>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-xs font-bold text-sky-600">
                    {getMemberName(selected.initiator).charAt(0)}
                  </div>
                  <span className="text-sm text-slate-800">{getMemberName(selected.initiator)}</span>
                </div>
              </div>

              {/* Approvers */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-3">Approvals</p>
                <div className="space-y-2">
                  {selected.approvals.map(approval => {
                    const member = mockMembers.find(m => m.id === approval.memberId);
                    if (!member) return null;

                    const isPending = approval.status === 'pending';

                    return (
                      <div key={approval.memberId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group/approval">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {approval.status === 'approved' && <CheckCircle2 size={16} className="text-emerald-500" />}
                          {approval.status === 'rejected' && <XCircle size={16} className="text-rose-500" />}
                          {approval.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                          <span className={`text-xs font-medium ${approval.status === 'approved' ? 'text-emerald-600' : approval.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                            {approval.date && <span className="ml-1">({formatDate(approval.date)})</span>}
                          </span>

                          {isPending && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/approval:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleApprove(selected.id, approval.memberId)}
                                className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(selected.id, approval.memberId)}
                                className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Progress</p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${(selected.approvals.filter(a => a.status === 'approved').length / selected.approvals.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selected.approvals.filter(a => a.status === 'approved').length} of {selected.approvals.length} approved
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Workflow Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 sticky top-0 bg-white flex items-center justify-between">
              <h2 className="font-bold text-slate-900">New Workflow</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddWorkflow} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Workflow Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual Budget Review"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the approval workflow..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Select Approvers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mockMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.approvers.includes(member.id)}
                        onChange={() => toggleApprover(member.id)}
                        className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={form.approvers.length === 0} className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
