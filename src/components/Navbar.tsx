import React from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';

export type AppViewMode = 'copy' | 'workspace';

interface NavbarProps {
  mode: AppViewMode;
  onChangeMode: (mode: AppViewMode) => void;
  onJumpToSection: (sectionId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const NAV_LINKS = [
  { id: 'funcionalidades', label: 'Funcionalidades' },
  { id: 'publico-alvo', label: 'Público-Alvo' },
  { id: 'diferencial', label: 'Diferencial' },
  { id: 'equipamentos', label: 'Equipamentos' },
  { id: 'ciclo-vendas', label: 'Ciclo' },
];

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onChangeMode,
  onJumpToSection,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLinkClick = (id: string) => {
    setMobileOpen(false);
    if (mode !== 'copy') {
      onChangeMode('copy');
      setTimeout(() => onJumpToSection(id), 80);
    } else {
      onJumpToSection(id);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => {
            onChangeMode('copy');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-lg font-bold tracking-tight text-[#1B2E5E] dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2E5E] dark:focus-visible:ring-[#F59E0B] rounded-sm"
        >
          Autec Smart Sales
        </button>

        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="hover:text-[#1B2E5E] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2E5E] dark:focus-visible:ring-[#F59E0B]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {/* Chave de alternância Dark / Light Mode */}
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={darkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            onClick={onToggleDarkMode}
            className="inline-flex items-center gap-2 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          >
            <Sun
              className={`w-3.5 h-3.5 transition-colors ${
                !darkMode ? 'text-[#F59E0B]' : 'text-slate-500'
              }`}
            />
            <span
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                darkMode ? 'bg-[#F59E0B]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
            <Moon
              className={`w-3.5 h-3.5 transition-colors ${
                darkMode ? 'text-[#F59E0B]' : 'text-slate-400'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => onChangeMode(mode === 'copy' ? 'workspace' : 'copy')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#1B2E5E] hover:bg-[#111E40] dark:bg-[#2B4C9B] dark:hover:bg-[#355BB8] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          >
            {mode === 'copy' ? 'Acessar Plataforma' : 'Ver Copy Completa'}
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onChangeMode(mode === 'copy' ? 'workspace' : 'copy');
            }}
            className="w-full mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B2E5E] dark:bg-[#2B4C9B] rounded-lg"
          >
            {mode === 'copy' ? 'Acessar Plataforma' : 'Ver Copy Completa'}
          </button>
        </div>
      )}
    </header>
  );
};
