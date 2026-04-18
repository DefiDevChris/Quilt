import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('StudioTopBar', () => {
  it('does not contain WorktableTabs component', () => {
    const filePath = path.join(process.cwd(), 'src/components/studio/StudioTopBar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).not.toContain('function WorktableTabs');
    expect(content).not.toContain('WorktableTabs({');
  });

  it('does not import or reference worktable tabs in render', () => {
    const filePath = path.join(process.cwd(), 'src/components/studio/StudioTopBar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    expect(content).not.toContain('<WorktableTabs');
    expect(content).not.toContain('Quilt | Block Builder');
    expect(content).not.toContain("label: 'Quilt'");
    expect(content).not.toContain("label: 'Block Builder'");
  });
});