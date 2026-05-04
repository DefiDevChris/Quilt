'use client';

import { useMemo } from 'react';
import { TemplateThumbnail } from '@/components/layout/TemplateThumbnail';
import { QUILT_TEMPLATES, type QuiltTemplate, type TemplateCategory } from '@/lib/templates';
import type { UserLayoutTemplate } from '@/types/layoutTemplate';
import { CATEGORIES, type TemplateCategoryFilter, type TemplateSubTab } from './layout-helpers';

interface TemplateCatalogProps {
  readonly subTab: TemplateSubTab;
  readonly onSubTabChange: (s: TemplateSubTab) => void;
  readonly category: TemplateCategoryFilter;
  readonly onCategoryChange: (c: TemplateCategoryFilter) => void;
  readonly systemTemplates: QuiltTemplate[];
  readonly libraryUserTemplates: UserLayoutTemplate[];
  readonly myTemplates: UserLayoutTemplate[];
  readonly templatesError: string | null;
  readonly templatesLoaded: boolean;
  readonly selectedSystemId: string | null;
  readonly selectedUserId: string | null;
  readonly onSelectSystem: (t: QuiltTemplate) => void;
  readonly onSelectUser: (t: UserLayoutTemplate) => void;
}

export function TemplateCatalog({
  subTab,
  onSubTabChange,
  category,
  onCategoryChange,
  systemTemplates,
  libraryUserTemplates,
  myTemplates,
  templatesError,
  templatesLoaded,
  selectedSystemId,
  selectedUserId,
  onSelectSystem,
  onSelectUser,
}: TemplateCatalogProps) {
  const showCategoryPills = subTab === 'library';

  const visibleUserLibrary = useMemo(() => {
    if (category === 'all') return libraryUserTemplates;
    return libraryUserTemplates.filter((t) => t.category === category);
  }, [category, libraryUserTemplates]);

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Templates</h2>
      </div>

      {/* Sub-tabs: Library | My Templates */}
      <div
        role="tablist"
        aria-label="Template source"
        className="flex border-b border-[var(--color-border)]/40 flex-shrink-0"
      >
        <SubTabButton
          label="Library"
          active={subTab === 'library'}
          onClick={() => onSubTabChange('library')}
        />
        <SubTabButton
          label="My Templates"
          active={subTab === 'my-templates'}
          onClick={() => onSubTabChange('my-templates')}
        />
      </div>

      {showCategoryPills && (
        <div className="flex gap-2 px-4 py-2 border-b border-[var(--color-border)]/30 overflow-x-auto flex-shrink-0">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                aria-pressed={isActive}
                className={`px-3 py-1 text-[12px] font-medium rounded-full transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                    : 'text-[var(--color-text-dim)] bg-[var(--color-bg)] hover:bg-[var(--color-border)]/30'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {subTab === 'library' && (
          <LibraryGrid
            systemTemplates={systemTemplates}
            userTemplates={visibleUserLibrary}
            selectedSystemId={selectedSystemId}
            selectedUserId={selectedUserId}
            onSelectSystem={onSelectSystem}
            onSelectUser={onSelectUser}
          />
        )}

        {subTab === 'my-templates' && (
          <MyTemplatesGrid
            templates={myTemplates}
            selectedId={selectedUserId}
            loaded={templatesLoaded}
            error={templatesError}
            onSelect={onSelectUser}
          />
        )}
      </div>
    </>
  );
}

function SubTabButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-2 text-[13px] leading-[18px] font-semibold transition-colors duration-150 ${
        active
          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}

function LibraryGrid({
  systemTemplates,
  userTemplates,
  selectedSystemId,
  selectedUserId,
  onSelectSystem,
  onSelectUser,
}: {
  readonly systemTemplates: QuiltTemplate[];
  readonly userTemplates: UserLayoutTemplate[];
  readonly selectedSystemId: string | null;
  readonly selectedUserId: string | null;
  readonly onSelectSystem: (t: QuiltTemplate) => void;
  readonly onSelectUser: (t: UserLayoutTemplate) => void;
}) {
  if (systemTemplates.length === 0 && userTemplates.length === 0) {
    return (
      <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">
        No templates in this category yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {systemTemplates.map((template) => (
        <SystemTemplateCard
          key={template.id}
          template={template}
          isSelected={selectedSystemId === template.id}
          onClick={() => onSelectSystem(template)}
        />
      ))}
      {userTemplates.map((tpl) => (
        <UserTemplateCard
          key={tpl.id}
          template={tpl}
          isSelected={selectedUserId === tpl.id}
          onClick={() => onSelectUser(tpl)}
        />
      ))}
    </div>
  );
}

function MyTemplatesGrid({
  templates,
  selectedId,
  loaded,
  error,
  onSelect,
}: {
  readonly templates: UserLayoutTemplate[];
  readonly selectedId: string | null;
  readonly loaded: boolean;
  readonly error: string | null;
  readonly onSelect: (t: UserLayoutTemplate) => void;
}) {
  if (!loaded) {
    return (
      <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">
        Loading your templates…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-[12px] text-[var(--color-error)] text-center py-8">
        {error}
      </p>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 px-4 space-y-2">
        <p className="text-[13px] font-semibold text-[var(--color-text)]">
          No saved templates yet
        </p>
        <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed">
          Save any quilt design as a template from the Studio top bar to reuse it later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((tpl) => (
        <UserTemplateCard
          key={tpl.id}
          template={tpl}
          isSelected={selectedId === tpl.id}
          onClick={() => onSelect(tpl)}
        />
      ))}
    </div>
  );
}

function SystemTemplateCard({
  template,
  isSelected,
  onClick,
}: {
  readonly template: QuiltTemplate;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-lg border transition-colors duration-150 ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
      }`}
    >
      <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2">
        <TemplateThumbnail template={template} className="w-full h-full" />
      </div>
      <span className="text-[12px] font-medium text-[var(--color-text)] text-center truncate w-full">
        {template.name}
      </span>
    </button>
  );
}

function UserTemplateCard({
  template,
  isSelected,
  onClick,
}: {
  readonly template: UserLayoutTemplate;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded-lg border transition-colors duration-150 ${
        isSelected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
      }`}
    >
      <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2 flex items-center justify-center">
        {template.thumbnailSvg ? (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: template.thumbnailSvg }}
          />
        ) : (
          <span className="text-[10px] text-[var(--color-text-dim)]">No preview</span>
        )}
      </div>
      <span className="text-[12px] font-medium text-[var(--color-text)] text-center truncate w-full">
        {template.name}
      </span>
    </button>
  );
}
