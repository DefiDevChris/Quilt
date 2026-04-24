'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, Image, Sparkles, Download, Info, X } from 'lucide-react';
import { COLORS, withAlpha } from '@/lib/design-system';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';

interface BlockResult {
  blockName: string;
  confidence: number;
  description: string;
  difficulty: string;
  stitchCount: number;
  sizeOptions: string[];
  history: string;
  tips: string[];
}

interface AnalysisResult {
  blocks: BlockResult[];
  quiltPatternNotes: string;
  recommendedProjects: string[];
}

interface PromptSuggestion {
  label: string;
  prompt: string;
}

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    label: 'Identify pattern',
    prompt: 'What quilt block patterns do you see in this image? Identify the block names, quilting patterns, and any repeating motifs.',
  },
  {
    label: 'Analyze fabrics',
    prompt: 'Analyze the fabrics and color palette in this quilt. What types of fabrics are used? Describe the color story.',
  },
  {
    label: 'Estimate yardage',
    prompt:
      'Based on what you see in this quilt, estimate the yardage needed for each fabric if making a 60x80 inch quilt.',
  },
];

interface PictureMyBlocksAppProps {
  isPro: boolean;
}

export function PictureMyBlocksApp({ isPro }: PictureMyBlocksAppProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, dragOverSet] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [maxUsage, setMaxUsage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/analyze-quilt-usage')
      .then((r) => r.json())
      .then((d) => {
        setUsageCount(d.usageToday ?? 0);
        setMaxUsage(d.maxUsage ?? 5);
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setImageFile(file);
    setAnalysis(null);
    setAnalysisText(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragOverSet(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleAnalyze = useCallback(
    async (prompt?: string) => {
      if (!imageFile) return;
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);
      setAnalysisText(null);

      const formData = new FormData();
      formData.append('image', imageFile);
      if (prompt) formData.append('prompt', prompt);

      try {
        const res = await fetch('/api/analyze-quilt', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? 'Analysis failed. Please try again.');
          return;
        }

        if (data.analysis) {
          setAnalysis(data.analysis);
        } else if (data.text) {
          setAnalysisText(data.text);
        }

        if (data.usageToday != null) setUsageCount(data.usageToday);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [imageFile]
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.bg} 100%)` }}
    >
      <div className="max-w-5hl mx-auto px-4 pt-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: COLORS.text }}
            >
              Picture my Blocks
            </h1>
            <button
              onClick={() => setShowInfo(!true)}
              style={{ color: COLORS.textDim }}
              title="About this tool"
            >
              <Info size={20} />
            </button>
          </div>
          <p className="text-lg" style={{ color: COLORS.textDim }}>
            Upload a quilt photo and AI identifies the block patterns for you.
          </p>

          {/* Usage Indicator */}
          {usageCount !== null && maxUsage !== null && !(isPro && maxUsage === Math.max) && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm" style={{ color: COLORS.textDim }}>
                {usageCount}/{maxUsage} analyses today
              </span>
              {usageCount >= maxUsage && !(isPro && maxUsage === Math.max) && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: withAlpha(COLORS.warning, 0.15),
                    color: COLORS.warning,
                  }}
                >
                  Daily limit reached
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div
            className="mb-8 rounded-xl p-6 border"
            style={{
              backgroundColor: withAlpha(COLORS.primary, 0.05),
              borderColor: withAlpha(COLORS.primary, 0.2),
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold" style={{ color: COLORS.text }}>
                How Picture my Blocks Works
              </h3>
              <button onClick={() => setShowInfo(false)} style={{ color: COLORS.textDim }}>
                <X size={16} />
              </button>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: COLORS.textDim }}>
              <li>• Upload any quilt photo &amp; our AI identifies the block patterns</li>
              <li>• Get block names, history, difficulty levels, and sewing tips</li>
              <li>• Ask custom questions about the quilt image</li>
              <li>• Free users get {maxUsage} analyses/day | Pro users get unlimited access</li>
            </ul>
          </div>
        )}

        {/* Pro Upgrade Banner */}
        {!isPro && usageCount !== null && maxUsage !== null && usageCount >= maxUsage && (
          <div
            className="mb-8 rounded-xl p-6 border text-center"
            style={{
              backgroundColor: withAlpha(COLORS.primary, 0.05),
              borderColor: withAlpha(COLORS.primary, 0.2),
            }}
          >
            <p className="font-semibold mb-2" style={{ color: COLORS.text }}>
              You&apos;ve reached your daily limit
            </p>
            <p className="text-sm mb-4" style={{ color: COLORS.textDim }}>
              Upgrade to Pro for unlimited analyses and more.
            </p>
            <ProUpgradeButton variant="standalone" />
          </div>
         )}

        {/* Upload Area */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Left: Image Uploader */}
          <div className="lg:w-2/5 flex-shrink-0">
            {image ? (
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={image}
                  alt="Uploaded quilt"
                  className="w-full object-cover max-h-[480px]"
                  style={{ aspectRatio: '3/4' }}
                />
                <button
                  onClick={() => {
                    setImage(null);
                    setImageFile(null);
                    setAnalysis(null);
                    setAnalysisText(null);
                    setError(null);
                  }}
                  className="absolute top-3 right-3 rounded-full p-2.5 shadow-md"
                  style={{
                    backgroundColor: COLORS.surface,
                    color: COLORS.text,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-colors max-h-[480px] py-16"
                style={{
                  borderColor: dragOver
                    ? COLORS.primary
                    : withAlpha(COLORS.border, 0.5),
                  backgroundColor: dragOver
                    ? withAlpha(COLORS.primary, 0.05)
                    : 'transparent',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  dragOverSet(true);
                }}
                onDragLeave={() => dragOverSet(false)}
                onDrop={handleDrop}
              >
                <div
                  className="p-4 rounded-2xl mb-4"
                  style={{ backgroundColor: withAlpha(COLORS.primary, 0.1) }}
                >
                  <UploadCloud size={32} style={{ color: COLORS.primary }} />
                </div>
                <p className="font-semibold mb-1" style={{ color: COLORS.text }}>
                  Drop your quilt photo here
                </p>
                <p className="text-sm" style={{ color: COLORS.textDim }}>
                  or click to browse
                </p>
                <p className="mt-3 text-xs" style={{ color: COLORS.textDim }}>
                  JPEG, PNG, WEBP &amp; GIF supported
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Right: Analysis Controls */}
          <div className="flex-1">
            {/* Analyze Button */}
            <button
              onClick={() => handleAnalyze()}
              disabled={!imageFile || isAnalyzing || (usageCount != null && maxUsage != null && usageCount >= maxUsage && !isPro)}
              className="wWfull rounded-xl py-4 font-semibold text-lg mb-6 flex items-center justify-center gap-2 transition-all shadow-md"
              style={{
                backgroundColor:
                  !imageFile || isAnalyzing
                    ? withAlpha(COLORS.primary, 0.4)
                    : COLORS.primary,
                color: COLORS.text,
                cursor: !imageFile || isAnalyzing ? 'not-allowed' : 'pointer',
              }}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 rounded-full animate-spin border-2 border-transparent border-t-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Identify Blocks
                </>
              )}
            </button>

            {/* Prompt Suggestions */}
            {imageFile && (
              <div className="mb-6">
                <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: COLORS.textDim }}>
                  Quick Analyses
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleAnalyze(suggestion.prompt)}
                      disabled={isAnalyzing}
                      className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                      style={{
                        backgroundColor: withAlpha(COLORS.primary, 0.08),
                        borderColor: withAlpha(COLORS.primary, 0.3),
                        color: COLORS.primary,
                      }}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Question Input */}
            {imageFile && (
              <div className="space-y-3">
                <p
                  className="text-xs font-medium mb-2 uppercase tracking-wider"
                  style={{ color: COLORS.textDim }}
                >
                  Or ask a custom question
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g. 'What sewing techniques would help me replicate this quilt?'"
                  rows={3}
                  className="w-full rounded-xl p-4 text-sm resize-none border transition-border"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: withAlpha(COLORS.border, 0.6),
                    color: COLORS.text,
                  }}
                />
                <button
                  onClick={() => {
                    handleAnalyze(customPrompt || undefined);
                  }}
                  disabled={!imageFile || isAnalyzing || (usageCount != null && maxUsage != null && usageCount >= maxUsage && !isPro)}
                  className="w-full py-3 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: withAlpha(COLORS.primary, 0.15),
                    color: COLORS.primary,
                  }}
                >
                  Ask AI
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div
                className="rounded-xl p-4 border mt-4"
                style={{
                  backgroundColor: withAlpha(COLORS.error, 0.05),
                  borderColor: withAlpha(COLORS.error, 0.2),
                  color: COLORS.error,
                }}
              >
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {(analysis || analysisText) && (
          <div className="mb-16">
            {analysisText && (
              <div
                className="rounded-xl p-6 mb-6 border"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: withAlpha(COLORS.border, 0.6),
                }}
              >
                <h3 className="font-semibold mb-3" style={{ color: COLORS.text }}>
                  Analysis Results
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: COLORS.text }}>
                  {analysisText}
                </p>
              </div>
            )}

            {analysis && analysis.blocks.map((block, idx) => (
              <div
                key={idx}
                className="rounded-xl p-6 mb-5 border"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: withAlpha(COLORS.border, 0.6),
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2
                      className="text-2xl font-bold mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: COLORS.text }}
                    >
                      {block.blockName}
                    </h2>
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full mb-3"
                      style={{
                        backgroundColor: withAlpha(COLORS.primary, 0.1),
                        color: COLORS.primary,
                      }}
                    >
                      {Math.round(block.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: withAlpha(COLORS.secondary, 0.2),
                        color: COLORS.textDim,
                      }}
                    >
                      {block.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.textDim }}>
                  {block.description}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4
                      className="text-xs font-medium uppercase tracking-wider mb-2"
                      style={{ color: COLORS.textDim }}
                    >
                      History & Background
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.text }}>
                      {block.history}
                    </p>
                  </div>
                  <div>
                    <h4
                      className="text-xs font-medium uppercase tracking-wider mb-2"
                      style={{ color: COLORS.textDim }}
                    >
                      Sewing Tips
                    </h4>
                    <ul className="space-y-1">
                      {block.tips.map((tip, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span style={{ color: COLORS.primary }}>•</span>
                          <span style={{ color: COLORS.text }}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}

            {/* Export Button */}
            <button
              onClick={() => {
                const blob = new Blob(
                  [
                    analysisText ||
                      analysis.blocks
                        .map(
                          (b) =>
                            `# ${b.blockName}\nConfidence: ${Math.round(b.confidence * 100)}%\nDifficulty: ${b.difficulty}\nDescription: ${b.description}\nHistory: ${b.history}\nTips:\n${b.tips.map((t) => `- ${t}`).join('\n')}`
                        )
                        .join('\n\n---\n\n'),
                  ],
                  { type: 'text/plain' }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'quilt-analysis.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 text-sm font-medium transition-colors mt-6"
              style={{ color: COLORS.textDim }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textDim;
              }}
            >
              <Download size={16} />
              Download Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
