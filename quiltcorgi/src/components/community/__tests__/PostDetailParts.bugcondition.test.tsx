/**
 * Bug Condition Exploration Test — LinkedProjectCard href
 *
 * Property 1: Bug Condition — Broken Studio href
 * Validates: Requirements 1.1, 2.1
 *
 * EXPECTED OUTCOME: These tests FAIL on unfixed code.
 * Failure confirms the bug exists:
 *   LinkedProjectCard renders href="/studio?project=<id>" instead of href="/studio/<id>"
 *
 * DO NOT fix the source code to make these pass — they are intentionally failing.
 */

/// <reference types="vitest/globals" />

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { LinkedProjectCard } from '../PostDetailParts';

// Mock next/link to render a plain <a> so we can inspect href
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/image to avoid SSR issues in jsdom
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('LinkedProjectCard — Bug Condition: href uses dynamic route segment', () => {
  /**
   * Concrete example: projectId = "abc-123"
   * Bug: renders href="/studio?project=abc-123"
   * Expected: href="/studio/abc-123"
   */
  it('renders href="/studio/abc-123" for projectId "abc-123"', () => {
    const { container } = render(
      <LinkedProjectCard
        projectId="abc-123"
        projectName="Test Project"
        projectThumbnailUrl={null}
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    // This assertion FAILS on unfixed code (actual: "/studio?project=abc-123")
    expect(anchor!.getAttribute('href')).toBe('/studio/abc-123');
  });

  /**
   * UUID-style projectId
   */
  it('renders href="/studio/550e8400-e29b-41d4-a716-446655440000" for a UUID projectId', () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const { container } = render(
      <LinkedProjectCard
        projectId={projectId}
        projectName="UUID Project"
        projectThumbnailUrl={null}
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor!.getAttribute('href')).toBe(`/studio/${projectId}`);
  });

  /**
   * Numeric string projectId
   */
  it('renders href="/studio/42" for numeric string projectId "42"', () => {
    const { container } = render(
      <LinkedProjectCard
        projectId="42"
        projectName="Numeric Project"
        projectThumbnailUrl={null}
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor!.getAttribute('href')).toBe('/studio/42');
  });

  /**
   * Slug-style projectId
   */
  it('renders href="/studio/my-quilt-project" for slug projectId', () => {
    const { container } = render(
      <LinkedProjectCard
        projectId="my-quilt-project"
        projectName="Slug Project"
        projectThumbnailUrl={null}
      />
    );
    const anchor = container.querySelector('a');
    expect(anchor!.getAttribute('href')).toBe('/studio/my-quilt-project');
  });

  /**
   * Property-based style: multiple arbitrary projectId values
   * Verifies the pattern "/studio/<projectId>" holds for all inputs.
   * Bug condition: href MUST NOT contain "?project=" — it must use the path segment.
   */
  it('never uses query-param form for any projectId (property: no ?project= in href)', () => {
    const projectIds = [
      'abc-123',
      'xyz-789',
      '550e8400-e29b-41d4-a716-446655440000',
      '42',
      'my-quilt-project',
      'UPPER-CASE-ID',
      'with spaces',
      'special!@#chars',
      'a',
      '0',
    ];

    for (const projectId of projectIds) {
      const { container } = render(
        <LinkedProjectCard
          projectId={projectId}
          projectName="Test"
          projectThumbnailUrl={null}
        />
      );
      const anchor = container.querySelector('a');
      const href = anchor!.getAttribute('href') ?? '';

      // Bug condition: href must NOT use query-param form
      expect(
        href,
        `projectId="${projectId}": href should not contain "?project="`
      ).not.toContain('?project=');

      // Expected behavior: href must use dynamic route segment
      expect(
        href,
        `projectId="${projectId}": href should equal "/studio/${projectId}"`
      ).toBe(`/studio/${projectId}`);
    }
  });
});
