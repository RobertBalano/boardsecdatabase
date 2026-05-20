import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  CheckSquare, 
  ChevronRight, 
  FolderOpen, 
  GitBranch, 
  BarChart3, 
  Vote, 
  ShieldCheck
} from 'lucide-react';

type Page = 'dashboard' | 'meetings' | 'members' | 'minutes' | 'actions' | 'documents' | 'workflow' | 'voting' | 'analytics' | 'resolutions' | 'accounts';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'meetings' as Page, label: 'Meetings', icon: Calendar },
  { id: 'members' as Page, label: 'Board Members', icon: Users },
  { id: 'minutes' as Page, label: 'Minutes', icon: FileText },
  { id: 'actions' as Page, label: 'Action Items', icon: CheckSquare },
  { id: 'documents' as Page, label: 'Documents', icon: FolderOpen },
  { id: 'workflow' as Page, label: 'Approvals', icon: GitBranch },
  { id: 'voting' as Page, label: 'Voting', icon: Vote },
  { id: 'analytics' as Page, label: 'Reports', icon: BarChart3 },
  { id: 'resolutions' as Page, label: 'Resolutions', icon: FileText },
  { id: 'accounts' as Page, label: 'Manage Account', icon: ShieldCheck },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-primary-900 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-primary-800/50">
        <div className="flex items-center gap-3">
          <img 
            src="/essu.jpg" 
            alt="ESSU Logo" 
            className="w-9 h-9 rounded-lg object-cover" 
          />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">BoardSec</p>
            <p className="text-primary-300 text-xs">Secretary Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                active
                  ? 'bg-accent-500/20 text-accent-300'
                  : 'text-primary-300 hover:text-primary-100 hover:bg-primary-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={active ? 'text-accent-400' : 'text-primary-400 group-hover:text-primary-200'} />
                <span className="font-medium">{label}</span>
              </div>
              {active && <ChevronRight size={14} className="text-accent-500" />}
            </button>
          );
        })}
      </nav>

     

      <div className="px-4 py-4 border-t border-primary-800/50">
        <div className="flex items-center gap-3">
          <img
            src="/debbie.jpg" 
            alt="Dr. Debbie Joyce R. Voloso"
            className="w-8 h-8 rounded-full object-cover border border-primary-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-primary-100 text-xs font-bold truncate">
              Dr. Debbie Joyce R. Voloso
            </p>
            <p className="text-primary-400 text-[10px] uppercase tracking-wider font-semibold truncate">
              Board Secretary
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}