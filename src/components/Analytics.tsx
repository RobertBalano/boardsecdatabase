import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; 

interface Metrics {
  id: number;
  attendance_value: string;
  attendance_subtext: string;
  action_items_value: string;
  action_items_subtext: string;
  compliance_value: string;
  compliance_subtext: string;
  risk_items_value: string;
  risk_items_subtext: string;
}

interface Report {
  id: number;
  created_at?: string;
  title: string;
  period: string;
  summary: string;
}

interface AnalyticsProps {
  userRole?: 'secretary' | 'member';
}

const blankMetricsFallback: Metrics = {
  id: 1,
  attendance_value: '0%',
  attendance_subtext: 'No data',
  action_items_value: '0%',
  action_items_subtext: 'No data',
  compliance_value: '0%',
  compliance_subtext: 'No data',
  risk_items_value: '0',
  risk_items_subtext: 'No data',
};

export default function Analytics({ userRole = 'secretary' }: AnalyticsProps) {
  const isSecretary = userRole === 'secretary';

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAnalyticsData();

  
    const metricsSubscription = supabase
      .channel('realtime-analytics')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'analytics_metrics' }, 
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            setMetrics(payload.new as Metrics);
          }
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'board_reports' }, 
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsSubscription);
    };
  }, []);

  async function fetchAnalyticsData() {
    try {
      setLoading(true);
      
      const { data: metricsData, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
        
      if (error) {
        console.error("Error reading metrics row:", error.message);
      }

      if (metricsData) {
        setMetrics(metricsData as Metrics);
      } else {
        setMetrics(blankMetricsFallback);
      }
      
      await fetchReports();
    } catch (error) {
      console.error("Critical error in analytics flow:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReports() {
    try {
      const { data: reportsData, error } = await supabase
        .from('board_reports')
        .select('*');
        
      if (error) {
        console.error("Supabase reports query error:", error.message);
        return;
      }
        
      if (reportsData) {
        
        const sorted = (reportsData as Report[]).sort((a, b) => Number(a.id) - Number(b.id));
        setReports(sorted);
      }
    } catch (err) {
      console.error("Failed to execute fetchReports execution:", err);
    }
  }

  const updateMetricInDatabase = async (columnName: keyof Metrics, value: string) => {
    if (!isSecretary) return;
    try {
      await supabase
        .from('analytics_metrics')
        .upsert({ id: 1, [columnName]: value });
    } catch (err) {
      console.error("Error upserting metric:", err);
    }
  };

  const addNewReportCard = async () => {
    if (!isSecretary) return;
    
    const newReportSample = {
      title: 'New Board Report Template',
      period: 'Select Period',
      summary: 'Click here to write your performance analytics or text insights summaries...'
    };

    try {
      
      const { data, error } = await supabase
        .from('board_reports')
        .insert([newReportSample])
        .select();

      if (error) {
        console.error("Error creating report in DB:", error.message);
        alert(`Failed to add report: ${error.message}. Check your RLS policies configuration.`);
        return;
      }

      if (data && data.length > 0) {
      
        setReports(prev => [...prev, data[0] as Report]);
      }
    } catch (err) {
      console.error("Exception caught adding card:", err);
    }
  };

  const updateReportInDatabase = async (id: number, field: keyof Report, value: string) => {
    if (!isSecretary) return;
    
    
    setReports(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    try {
      const { error } = await supabase
        .from('board_reports')
        .update({ [field]: value })
        .eq('id', id);

      if (error) {
        console.error("Error updating database report row:", error.message);
      }
    } catch (err) {
      console.error("Exception updating card row:", err);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-8 text-slate-500 text-sm flex items-center gap-2">
        <svg className="animate-spin h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading Analytics Portal Data...</span>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen w-full">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">Board performance metrics and insights</p>
        </div>
        
        {isSecretary && (
          <button
            onClick={addNewReportCard}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+ Add New Report</span>
          </button>
        )}
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Meeting Attendance</p>
          <input 
            type="text" 
            value={metrics.attendance_value || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, attendance_value: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('attendance_value', e.target.value)}
            className="w-full text-3xl font-bold text-slate-900 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
          <input 
            type="text" 
            value={metrics.attendance_subtext || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, attendance_subtext: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('attendance_subtext', e.target.value)}
            className="w-full text-xs text-emerald-600 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
        </div>

        
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Action Items</p>
          <input 
            type="text" 
            value={metrics.action_items_value || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, action_items_value: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('action_items_value', e.target.value)}
            className="w-full text-3xl font-bold text-slate-900 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
          <input 
            type="text" 
            value={metrics.action_items_subtext || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, action_items_subtext: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('action_items_subtext', e.target.value)}
            className="w-full text-xs text-emerald-600 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
        </div>

      
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Policy Compliance</p>
          <input 
            type="text" 
            value={metrics.compliance_value || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, compliance_value: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('compliance_value', e.target.value)}
            className="w-full text-3xl font-bold text-slate-900 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
          <input 
            type="text" 
            value={metrics.compliance_subtext || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, compliance_subtext: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('compliance_subtext', e.target.value)}
            className="w-full text-xs text-emerald-600 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
        </div>

      
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Risk Items</p>
          <input 
            type="text" 
            value={metrics.risk_items_value || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, risk_items_value: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('risk_items_value', e.target.value)}
            className="w-full text-3xl font-bold text-slate-900 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
          <input 
            type="text" 
            value={metrics.risk_items_subtext || ''} 
            disabled={!isSecretary}
            onChange={(e) => setMetrics({ ...metrics, risk_items_subtext: e.target.value })}
            onBlur={(e) => updateMetricInDatabase('risk_items_subtext', e.target.value)}
            className="w-full text-xs text-slate-500 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
          />
        </div>

      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report.id} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <input 
                type="text"
                value={report.title || ''}
                disabled={!isSecretary}
                onChange={(e) => updateReportInDatabase(report.id, 'title', e.target.value)}
                className="w-full font-semibold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
              />
              <input 
                type="text"
                value={report.period || ''}
                disabled={!isSecretary}
                onChange={(e) => updateReportInDatabase(report.id, 'period', e.target.value)}
                className="w-full text-xs text-slate-400 mt-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none disabled:hover:border-transparent"
              />
              <textarea 
                value={report.summary || ''}
                rows={3}
                disabled={!isSecretary}
                onChange={(e) => updateReportInDatabase(report.id, 'summary', e.target.value)}
                className="w-full text-xs text-slate-500 mt-3 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none resize-none leading-relaxed disabled:hover:border-transparent"
              />
            </div>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-2 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
            No board reports found. Click "+ Add New Report" above to generate a new entry.
          </div>
        )}
      </div>
    </div>
  );
}