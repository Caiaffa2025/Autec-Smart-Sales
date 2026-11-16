/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Navbar, type AppViewMode } from './components/Navbar';
import { LandingCopyView } from './components/LandingCopyView';
import { WorkspaceView, type WorkspaceTab } from './components/WorkspaceView';

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('autec-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export default function App() {
  const [mode, setMode] = useState<AppViewMode>('copy');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('gerador');
  const [workspaceEquipmentId, setWorkspaceEquipmentId] = useState<string | undefined>(undefined);
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('autec-theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  const handleOpenWorkspace = (tab: WorkspaceTab = 'gerador', equipmentId?: string) => {
    setWorkspaceTab(tab);
    setWorkspaceEquipmentId(equipmentId);
    setMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Navbar
        mode={mode}
        onChangeMode={(nextMode) => {
          setMode(nextMode);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onJumpToSection={handleJumpToSection}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {mode === 'copy' ? (
        <LandingCopyView onOpenWorkspace={handleOpenWorkspace} />
      ) : (
        <WorkspaceView
          key={`${workspaceTab}-${workspaceEquipmentId || 'default'}`}
          initialTab={workspaceTab}
          initialEquipmentId={workspaceEquipmentId}
        />
      )}
    </div>
  );
}
