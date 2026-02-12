import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout';
import { useProject } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Settings, Tag, Building2, Wrench } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { CategoriesSettings } from '@/components/settings/CategoriesSettings';
import { CompanyTypesManager } from '@/components/settings/CompanyTypesManager';
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';

type SettingsTab = 'general' | 'categories' | 'company-types' | 'advanced';

const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'company-types', label: 'Company Types', icon: Building2 },
  { id: 'advanced', label: 'Advanced (Crawl Jobs)', icon: Wrench },
];

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <DashboardLayout projectName={project?.name}>
      <div className="flex h-full">
        {/* Settings Sub-Navigation */}
        <aside className="w-60 shrink-0 border-r border-border">
          <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Settings
            </h2>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-8 max-w-3xl">
            <h1 className="text-2xl font-semibold text-foreground mb-6">
              Unified Settings and Administration
            </h1>

            {activeTab === 'general' && <GeneralSettings projectId={projectId!} />}
            {activeTab === 'categories' && <CategoriesSettings />}
            {activeTab === 'company-types' && <CompanyTypesManager />}
            {activeTab === 'advanced' && <AdvancedSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
