'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import {
  normalizeCells,
  recomputeResult,
  findClickedPiece,
  generatePatternResult,
  downloadDataUrl,
  buildSvg,
} from '@/lib/photo-to-quilt/processing';
import { patternResultToFabricJson } from '@/lib/photo-to-quilt/to-fabric';
import { autoPieceSize } from '@/lib/photo-to-quilt/auto-piece-size';
import CanvasToolbar from './CanvasToolbar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

const BLOCK_SIZE = 3;

export default function WizardStepCanvas() {
  const router = useRouter();

  const image = usePhotoToQuiltStore((s) => s.image);
  const mask = usePhotoToQuiltStore((s) => s.mask);
  const workingSize = usePhotoToQuiltStore((s) => s.workingSize);
  const pieceSizeDetail = usePhotoToQuiltStore((s) => s.pieceSizeDetail);
  const colorCount = usePhotoToQuiltStore((s) => s.colorCount);
  const enhance = usePhotoToQuiltStore((s) => s.enhance);
  const showGrid = usePhotoToQuiltStore((s) => s.showGrid);
  const showBlockGrid = usePhotoToQuiltStore((s) => s.showBlockGrid);
  const editMode = usePhotoToQuiltStore((s) => s.editMode);
  const paintColorIdx = usePhotoToQuiltStore((s) => s.paintColorIdx);
  const result = usePhotoToQuiltStore((s) => s.result);
  const history = usePhotoToQuiltStore((s) => s.history);
  const historyIndex = usePhotoToQuiltStore((s) => s.historyIndex);
  const generating = usePhotoToQuiltStore((s) => s.generating);
  const showSaveModal = usePhotoToQuiltStore((s) => s.showSaveModal);
  const saveName = usePhotoToQuiltStore((s) => s.saveName);
  const isSaving = usePhotoToQuiltStore((s) => s.isSaving);
  const saveError = usePhotoToQuiltStore((s) => s.saveError);
  const showStartOverConfirm = usePhotoToQuiltStore((s) => s.showStartOverConfirm);

  const setResult = usePhotoToQuiltStore((s) => s.setResult);
  const setHistory = usePhotoToQuiltStore((s) => s.setHistory);
  const setHistoryIndex = usePhotoToQuiltStore((s) => s.setHistoryIndex);
  const setGenerating = usePhotoToQuiltStore((s) => s.setGenerating);
  const setEditMode = usePhotoToQuiltStore((s) => s.setEditMode);
  const setShowSaveModal = usePhotoToQuiltStore((s) => s.setShowSaveModal);
  const setSaveName = usePhotoToQuiltStore((s) => s.setSaveName);
  const setIsSaving = usePhotoToQuiltStore((s) => s.setIsSaving);
  const setSaveError = usePhotoToQuiltStore((s) => s.setSaveError);
  const setShowStartOverConfirm = usePhotoToQuiltStore((s) => s.setShowStartOverConfirm);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const imageAspect = workingSize.height > 0 ? workingSize.width / workingSize.height : null;

  const cols = result?.cols ?? 0;
  const rows = result?.rows ?? 0;
  const blockCols = result?.blockCols ?? 0;
  const blockRows = result?.blockRows ?? 0;

  const renderCanvas = useCallback(
    (cells: typeof result extends null ? never : NonNullable<typeof result>['cells'], pal: string[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxPx = 980;
      const cellPx = Math.max(7, Math.floor(maxPx / cols));
      canvas.width = cols * cellPx;
      canvas.height = rows * cellPx;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const cell of cells) {
        const px = cell.x * cellPx;
        const py = cell.y * cellPx;
        for (const p of cell.pieces) {
          if (p.isBackground) continue;
          ctx.fillStyle = pal[p.colorIndex];
          ctx.strokeStyle = pal[p.colorIndex];
          ctx.lineWidth = 0.5;
          ctx.lineJoin = 'miter';
          if (p.kind === 'square') {
            const w = cellPx * (p.spanW ?? 1);
            const h = cellPx * (p.spanH ?? 1);
            ctx.fillRect(px, py, w, h);
            ctx.strokeRect(px, py, w, h);
          } else if (p.kind === 'triangle-a') {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + cellPx * (p.spanW ?? 1), py);
            ctx.lineTo(px, py + cellPx * (p.spanH ?? 1));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (p.kind === 'triangle-b') {
            ctx.beginPath();
            ctx.moveTo(px + cellPx * (p.spanW ?? 1), py);
            ctx.lineTo(px + cellPx * (p.spanW ?? 1), py + cellPx * (p.spanH ?? 1));
            ctx.lineTo(px, py + cellPx * (p.spanH ?? 1));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      if (showGrid) {
        if (showBlockGrid) {
          ctx.strokeStyle = 'rgba(54,49,45,0.5)';
          ctx.lineWidth = 2;
          for (let by = 0; by <= blockRows; by++) {
            const y = by * BLOCK_SIZE * cellPx;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(cols * cellPx, y);
            ctx.stroke();
          }
          for (let bx = 0; bx <= blockCols; bx++) {
            const x = bx * BLOCK_SIZE * cellPx;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, rows * cellPx);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = 'rgba(54,49,45,0.18)';
        ctx.lineWidth = 0.8;
        for (const cell of cells) {
          const px = cell.x * cellPx;
          const py = cell.y * cellPx;
          for (const p of cell.pieces) {
            if (p.isBackground) continue;
            if (p.kind === 'square') {
              ctx.strokeRect(
                px + 0.5,
                py + 0.5,
                cellPx * (p.spanW ?? 1),
                cellPx * (p.spanH ?? 1),
              );
            } else if (p.kind === 'triangle-a') {
              ctx.beginPath();
              ctx.moveTo(px + 0.5, py + 0.5);
              ctx.lineTo(
                px + cellPx * (p.spanW ?? 1) + 0.5,
                py + 0.5,
              );
              ctx.lineTo(
                px + 0.5,
                py + cellPx * (p.spanH ?? 1) + 0.5,
              );
              ctx.stroke();
            } else if (p.kind === 'triangle-b') {
              ctx.beginPath();
              ctx.moveTo(
                px + cellPx * (p.spanW ?? 1) + 0.5,
                py + 0.5,
              );
              ctx.lineTo(
                px + cellPx * (p.spanW ?? 1) + 0.5,
                py + cellPx * (p.spanH ?? 1) + 0.5,
              );
              ctx.lineTo(px + 0.5, py + cellPx * (p.spanH ?? 1) + 0.5);
              ctx.stroke();
            }
          }
        }
      }
    },
    [cols, rows, blockCols, blockRows, showGrid, showBlockGrid],
  );

  useEffect(() => {
    if (result) {
      renderCanvas(result.cells, result.palette);
      setResult({
        ...result,
        svgMarkup: buildSvg(
          result.cells,
          result.cols,
          result.rows,
          result.blockSize,
          result.blockCols,
          result.blockRows,
          result.palette,
          showGrid,
        ),
      });
    }
  }, [showGrid, showBlockGrid, renderCanvas, result, setResult]);

  const generatePattern = useCallback(() => {
    if (!image || !mask) return;
    setGenerating(true);
    requestAnimationFrame(() => {
      try {
        const ps = autoPieceSize();
        const newResult = generatePatternResult(
          image,
          mask,
          workingSize,
          pieceSizeDetail,
          colorCount,
          enhance,
          showGrid,
          imageAspect,
        );
        const finalResult = { ...newResult, pieceSizeInches: ps };
        renderCanvas(finalResult.cells, finalResult.palette);
        setResult(finalResult);
        setHistory([finalResult]);
        setHistoryIndex(0);
        setEditMode('view');
      } finally {
        setGenerating(false);
      }
    });
  }, [
    image,
    mask,
    workingSize,
    pieceSizeDetail,
    colorCount,
    enhance,
    showGrid,
    imageAspect,
    renderCanvas,
    setResult,
    setHistory,
    setHistoryIndex,
    setEditMode,
    setGenerating,
  ]);

  useEffect(() => {
    if (image && mask && !result && !generating) {
      const t = setTimeout(() => generatePattern(), 50);
      return () => clearTimeout(t);
    }
  }, [image, mask, result, generating, generatePattern]);

  useEffect(() => {
    if (image && mask && result && !generating) {
      const t = setTimeout(() => generatePattern(), 300);
      return () => clearTimeout(t);
    }
  }, [pieceSizeDetail, colorCount, enhance, generatePattern, image, mask, result, generating]);

  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (editMode === 'view' || !result) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      const maxPx = 980;
      const cellPx = Math.max(7, Math.floor(maxPx / cols));
      const gridX = Math.floor(cx / cellPx);
      const gridY = Math.floor(cy / cellPx);
      if (gridX < 0 || gridX >= cols || gridY < 0 || gridY >= rows)
        return;

      const currentResult = usePhotoToQuiltStore.getState().result;
      if (!currentResult) return;

      const newCells = normalizeCells(currentResult.cells);
      const cellIndex = newCells.findIndex(
        (c) => c.x === gridX && c.y === gridY,
      );
      if (cellIndex < 0) return;
      const cell = newCells[cellIndex];
      const clicked = findClickedPiece(cx, cy, cellPx, cell);
      if (!clicked) return;

      const newPieces = [...cell.pieces];

      if (editMode === 'erase') {
        if (clicked.newKind) {
          const original = newPieces[clicked.pieceIndex];
          newPieces.splice(clicked.pieceIndex, 1);
          if (clicked.newKind === 'triangle-a') {
            if (!original.isBackground) {
              newPieces.push({
                colorIndex: original.colorIndex,
                kind: 'triangle-b',
                spanW: 1,
                spanH: 1,
                isBackground: false,
              });
            }
          } else {
            if (!original.isBackground) {
              newPieces.push({
                colorIndex: original.colorIndex,
                kind: 'triangle-a',
                spanW: 1,
                spanH: 1,
                isBackground: false,
              });
            }
          }
        } else {
          newPieces.splice(clicked.pieceIndex, 1);
        }
        newCells[cellIndex] = {
          ...cell,
          pieces: newPieces.filter((p) => !p.isBackground),
        };
      } else if (editMode === 'paint') {
        if (clicked.newKind) {
          const original = newPieces[clicked.pieceIndex];
          newPieces.splice(clicked.pieceIndex, 1);
          if (clicked.newKind === 'triangle-a') {
            newPieces.push({
              colorIndex: paintColorIdx,
              kind: 'triangle-a',
              spanW: 1,
              spanH: 1,
              isBackground: false,
            });
            if (!original.isBackground) {
              newPieces.push({
                colorIndex: original.colorIndex,
                kind: 'triangle-b',
                spanW: 1,
                spanH: 1,
                isBackground: false,
              });
            }
          } else {
            if (!original.isBackground) {
              newPieces.push({
                colorIndex: original.colorIndex,
                kind: 'triangle-a',
                spanW: 1,
                spanH: 1,
                isBackground: false,
              });
            }
            newPieces.push({
              colorIndex: paintColorIdx,
              kind: 'triangle-b',
              spanW: 1,
              spanH: 1,
              isBackground: false,
            });
          }
        } else {
          newPieces[clicked.pieceIndex] = {
            ...newPieces[clicked.pieceIndex],
            colorIndex: paintColorIdx,
            isBackground: false,
          };
        }
        newCells[cellIndex] = { ...cell, pieces: newPieces };
      }

      const nextResult = recomputeResult(currentResult, newCells);
      renderCanvas(nextResult.cells, nextResult.palette);

      const s = usePhotoToQuiltStore.getState();
      const before = s.history.slice(0, s.historyIndex + 1);
      usePhotoToQuiltStore.setState({
        result: nextResult,
        history: [...before, nextResult],
        historyIndex: s.historyIndex + 1,
      });
    },
    [editMode, paintColorIdx, cols, rows, result, renderCanvas],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const s = usePhotoToQuiltStore.getState();
        if (e.shiftKey) {
          if (s.historyIndex < s.history.length - 1) {
            const next = s.history[s.historyIndex + 1];
            usePhotoToQuiltStore.setState({
              result: next,
              historyIndex: s.historyIndex + 1,
            });
          }
        } else {
          if (s.historyIndex > 0) {
            const prev = s.history[s.historyIndex - 1];
            usePhotoToQuiltStore.setState({
              result: prev,
              historyIndex: s.historyIndex - 1,
            });
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSaveToStudio = async () => {
    if (!result) return;
    const user = useAuthStore.getState().user;
    if (!user) {
      router.push('/auth/signin?callbackUrl=/photo-to-quilt');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const canvasData = patternResultToFabricJson(result);
      const quiltW = result.cols * result.pieceSizeInches;
      const quiltH = result.rows * result.pieceSizeInches;
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim() || 'Photo Quilt Design',
          mode: 'photo-to-quilt',
          unitSystem: 'imperial',
          canvasWidth: quiltW,
          canvasHeight: quiltH,
          canvasData,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save project');
      }
      const json = await res.json();
      if (!json.success || !json.data?.id) {
        throw new Error('Invalid response from server');
      }
      setShowSaveModal(false);
      setSaveName('');
      router.push(`/studio/${json.data.id}`);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadDataUrl(canvas.toDataURL('image/png'), 'quiltcorgi-pattern.png');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--color-bg)]">
      <div className="h-12 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[15px] text-[var(--color-text)] tracking-[-0.01em]">
            Photo to Quilt
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStartOverConfirm(true)}
            className="btn-secondary text-sm inline-flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Start Over
          </button>
          {result && (
            <button
              type="button"
              onClick={() => {
                setSaveName('');
                setSaveError(null);
                setShowSaveModal(true);
              }}
              className="btn-primary text-sm inline-flex items-center gap-1.5"
            >
              <Save size={14} />
              Continue in Studio
            </button>
          )}
        </div>
      </div>

      <CanvasToolbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftPanel />

        <section className="flex-1 min-h-0 flex items-center justify-center p-4 relative">
          <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-elevated overflow-hidden">
            <canvas
              ref={canvasRef}
              style={{
                cursor:
                  editMode === 'paint'
                    ? 'crosshair'
                    : editMode === 'erase'
                      ? 'pointer'
                      : 'default',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 180px)',
              }}
              onMouseDown={(e) => {
                setIsMouseDown(true);
                handleCanvasInteraction(e);
              }}
              onMouseMove={(e) => {
                if (isMouseDown) handleCanvasInteraction(e);
              }}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
            />

            {generating && (
              <div className="absolute inset-0 grid place-items-center bg-[var(--color-bg)]/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="grid place-items-center w-16 h-16 rounded-full bg-[var(--color-secondary)]">
                    <Loader2
                      size={32}
                      className="animate-spin text-[var(--color-primary)]"
                    />
                  </div>
                  <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[var(--color-text)]">
                    Generating Pattern…
                  </h2>
                  <p className="text-sm text-[var(--color-text-dim)]">
                    Filtering colors and building blocks
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <RightPanel />
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm mx-4">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[var(--color-text)] mb-4">
              Save to Studio
            </h2>
            <label className="block mb-4">
              <span className="block text-sm font-semibold text-[var(--color-text-dim)] mb-1">
                Project Name
              </span>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Photo Quilt Design"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleSaveToStudio}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save & Open'}
              </button>
            </div>
            <button
              type="button"
              className="w-full btn-secondary text-sm"
              onClick={handleDownloadPng}
            >
              Download PNG
            </button>
            {saveError && (
              <p className="text-sm text-[var(--color-error)] mt-2">{saveError}</p>
            )}
          </div>
        </div>
      )}

      {showStartOverConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm mx-4">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[var(--color-text)] mb-2">
              Start Over?
            </h2>
            <p className="text-sm text-[var(--color-text-dim)] mb-5">
              This will clear your current pattern and all edits. This
              action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setShowStartOverConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 rounded-full bg-[var(--color-error)] text-white text-sm font-semibold hover:opacity-90 transition-colors duration-150"
                onClick={() => {
                  usePhotoToQuiltStore.getState().resetAll();
                  setShowStartOverConfirm(false);
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
