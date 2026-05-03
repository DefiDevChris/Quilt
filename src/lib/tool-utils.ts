import { ToolDef } from '@/components/ui/ToolIcon';

export interface ToolGroup {
  name: string;
  items: ToolDef[];
}

/**
 * Group a flat list of tools by their `group` property (or 'default').
 * Maintains original order and creates a new group whenever the group name
 * changes.
 */
export function groupToolsByGroup(tools: ToolDef[]): ToolGroup[] {
  const groups: ToolGroup[] = [];
  let currentGroup = '';
  for (const tool of tools) {
    const group = tool.group ?? 'default';
    if (group !== currentGroup) {
      groups.push({ name: group, items: [tool] });
      currentGroup = group;
    } else {
      groups[groups.length - 1].items.push(tool);
    }
  }
  return groups;
}
