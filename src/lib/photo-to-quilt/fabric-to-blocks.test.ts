import { describe, it, expect } from 'vitest';
import { extractBlocksFromFabricObjects } from './fabric-to-blocks';

describe('extractBlocksFromFabricObjects', () => {
  it('single triangle-a produces hst with ulColor only', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-a',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#ff0000',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    expect(blocks.length).toBe(1);
    expect(blocks[0].cells[0][0]).toEqual({
      kind: 'hst',
      ulColor: '#ff0000',
      lrColor: undefined,
    });
  });

  it('single triangle-b produces hst with lrColor only', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-b',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#00ff00',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    expect(blocks.length).toBe(1);
    expect(blocks[0].cells[0][0]).toEqual({
      kind: 'hst',
      ulColor: undefined,
      lrColor: '#00ff00',
    });
  });

  it('both triangle-a and triangle-b produce hst with ulColor and lrColor', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-a',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#ff0000',
          },
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-b',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#00ff00',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    expect(blocks.length).toBe(1);
    expect(blocks[0].cells[0][0]).toEqual({
      kind: 'hst',
      ulColor: '#ff0000',
      lrColor: '#00ff00',
    });
  });

  it('single square produces square cell', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'square',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#0000ff',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    expect(blocks.length).toBe(1);
    expect(blocks[0].cells[0][0]).toEqual({
      kind: 'square',
      color: '#0000ff',
    });
  });

  it('empty block produces empty cells', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    expect(blocks.length).toBe(1);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(blocks[0].cells[row][col]).toEqual({ kind: 'empty' });
      }
    }
  });

  it('square cell has no ulColor/lrColor properties', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'square',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#0000ff',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    const cell = blocks[0].cells[0][0];
    expect(cell).toEqual({ kind: 'square', color: '#0000ff' });
    expect('ulColor' in cell).toBe(false);
    expect('lrColor' in cell).toBe(false);
  });

  it('triangle-a only cell has ulColor, no lrColor', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-a',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#ff0000',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    const cell = blocks[0].cells[0][0];
    expect(cell).toEqual({ kind: 'hst', ulColor: '#ff0000', lrColor: undefined });
    expect('color' in cell).toBe(false);
  });

  it('triangle-b only cell has lrColor, no ulColor', () => {
    const objects = [
      {
        __isBlockGroup: true,
        __photoQuiltBlock: { bx: 0, by: 0 },
        objects: [
          {
            __pieceRole: 'patch',
            __pieceKind: 'triangle-b',
            __photoQuiltCell: { x: 0, y: 0 },
            fill: '#00ff00',
          },
        ],
      },
    ];

    const blocks = extractBlocksFromFabricObjects(objects as never);
    const cell = blocks[0].cells[0][0];
    expect(cell).toEqual({ kind: 'hst', ulColor: undefined, lrColor: '#00ff00' });
    expect('color' in cell).toBe(false);
  });
});
