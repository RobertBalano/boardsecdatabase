import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Meetings from './components/Meetings';
import Members from './components/Members';
import Minutes from './components/Minutes';
import ActionItems from './components/ActionItems';
import Documents from './components/Documents';
import Workflow from './components/Workflow';
import Voting from './components/Voting';
import Analytics from './components/Analytics';
import Resolutions from './components/Resolutions';
import ManageAccount from './components/Manage Accounts';

// 2. Add 'accounts' to the Page type
type Page = 'dashboard' | 'meetings' | 'members' | 'minutes' | 'actions' | 'documents' | 'workflow' | 'voting' | 'analytics' | 'resolutions' | 'accounts';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
          {currentPage === 'meetings' && <Meetings />}
          {currentPage === 'members' && <Members />}
          {currentPage === 'minutes' && <Minutes />}
          {currentPage === 'actions' && <ActionItems />}
          {currentPage === 'documents' && <Documents />}
          {currentPage === 'workflow' && <Workflow />}
          {currentPage === 'voting' && <Voting />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'resolutions' && <Resolutions />}
          {/* 3. Add the conditional render for the accounts page */}
          {currentPage === 'accounts' && <ManageAccount />}
        </div>
      </main>
    </div>
  );
}

export default App;