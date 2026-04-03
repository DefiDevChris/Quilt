import type { ParsedPattern } from '../lib/pattern-parser-types';

export interface PatternTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  skillLevel: 'beginner' | 'confident-beginner' | 'intermediate' | 'advanced';
  finishedWidth: number;
  finishedHeight: number;
  blockCount: number;
  fabricCount: number;
  thumbnailUrl: string | null;
  patternData: ParsedPattern;
  tags: string[];
  importCount: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface PatternTemplateListItem {
  id: string;
  slug: string;
  name: string;
  skillLevel: 'beginner' | 'confident-beginner' | 'intermediate' | 'advanced';
  finishedWidth: number;
  finishedHeight: number;
  blockCount: number;
  fabricCount: number;
  thumbnailUrl: string | null;
  importCount: number;
}

export interface PatternTemplateDetail {
  id: string;
  slug: string;
  name: string;
  skillLevel: 'beginner' | 'confident-beginner' | 'intermediate' | 'advanced';
  finishedWidth: number;
  finishedHeight: number;
  blockCount: number;
  fabricCount: number;
  thumbnailUrl: string | null;
  importCount: number;
  description: string;
  tags: string[];
  patternData: ParsedPattern;
}
