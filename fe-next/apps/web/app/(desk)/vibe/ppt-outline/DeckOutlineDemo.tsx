'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SlideOutline = {
  id: string;
  type?: string;
  title: string;
  points: string[];
  image_suggestion?: string;
  style_hint?: string;
  subtitle?: string;
  body?: string;
  theme?: string;
  custom_class?: string;
};

type SlideCard = SlideOutline & {
  presetId: string;
  confirmed: boolean;
  payload?: SlidePayload;
};

type SlidePayload = {
  layout?: string;
  theme?: string;
  custom_class?: string;
  content?: {
    title?: string;
    subtitle?: string;
    points?: string[];
    body?: string;
    image_suggestion?: string;
  };
};

type StylePreset = {
  id: string;
  name: string;
  accent: string;
  border: string;
  surface: string;
  summary: string;
  text: string;
};

const STYLE_PRESETS: Record<string, StylePreset> = {
  'emerald-serif': {
    id: 'emerald-serif',
    name: 'Emerald Serif',
    accent: '#0f766e',
    border: 'rgba(16,185,129,0.28)',
    surface: 'linear-gradient(135deg, #ecfdf3, #ffffff)',
    summary: '稳重的祖母绿 + serif 标题，用于决策/封面。',
    text: '#0f172a',
  },
  'amber-notebook': {
    id: 'amber-notebook',
    name: 'Amber Notebook',
    accent: '#b45309',
    border: 'rgba(245,158,11,0.28)',
    surface: 'linear-gradient(135deg, #fffbeb, #fefce8)',
    summary: '琥珀高光 + 纸质纹理感，适合教程/流程页。',
    text: '#1c1917',
  },
  'ink-minimal': {
    id: 'ink-minimal',
    name: 'Ink Minimal',
    accent: '#0f172a',
    border: 'rgba(15,23,42,0.2)',
    surface: 'linear-gradient(135deg, #f8fafc, #ffffff)',
    summary: '纯净留白 + 深墨色，适配技术概念/拆解。',
    text: '#0f172a',
  },
};

const SAMPLE_JSON = `{
  "slides": [
    {
      "layout": "hero",
      "theme": "noir",
      "content": {
        "title": "拒绝路人感",
        "subtitle": "3分钟学会「叙事感」摄影技巧"
      },
      "custom_class": "bg-stone-950 text-white tracking-widest font-serif"
    },
    {
      "layout": "bento",
      "theme": "sapphire",
      "content": {
        "title": "构图三要素",
        "points": [
          "留白与三分法",
          "黄金时刻光影",
          "引导线应用"
        ]
      },
      "custom_class": "border border-blue-500/20 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)]"
    },
    {
      "layout": "split",
      "theme": "forest",
      "content": {
        "title": "光线捕捉",
        "body": "学会给画面做减法，利用光线捕捉情绪。黄金时刻是避开正午的最佳选择。",
        "image_suggestion": "一张极简风格照片，侧逆光勾勒发丝"
      },
      "custom_class": "rounded-tl-[5rem] bg-gradient-to-br from-emerald-50 to-white"
    }
  ]
}`;

const VISUAL_PROTOCOL = `# Role: 高级幻灯片排版专家 (AI-native Presentation Designer)

## Mission:
将用户输入的大纲转化为精美的 PPT JSON 数据。你必须严格遵守以下“视觉协议”。

## 视觉协议规范:
1. 布局选择 (Layout Mode):
   - [hero]: 仅用于封面或需要震撼感的单句总结。
   - [bento]: 用于需要展示 3-5 个并列要点的复杂页面，利用非对称网格感。
   - [split]: 用于左边文字说明、右边配图/代码块的场景。
   - [list]: 用于目录或逻辑性强的步骤说明。

2. 配色方案 (Color Tokens):
   - [noir]: 极简主义、黑白、高冷。
   - [sapphire]: 深蓝、科技感、数据驱动。
   - [forest]: 浅绿、舒适、可持续感。
   - [sunset]: 暖色、渐变、充满活力。

3. Tailwind 微调 (custom_class):
   - 你可以添加: 阴影 (shadow-xl)、渐变 (bg-gradient-to-r)、毛玻璃 (backdrop-blur)、圆角强化 (rounded-[3rem])。
   - 禁止修改: 基础的布局对齐逻辑 (如 flex/grid)。

## 输出格式:
必须且只能输出严格的 JSON 格式，不要包含任何 Markdown 标识符或解释。

## 配套布局样式设计:
- hero: 强对比、超大字号，建议 noir/sunset，加入渐变或玻璃拟态。
- bento: 非对称卡片网格，卡片可加 shadow-xl、rounded-[2rem]，建议 sapphire/forest。
- split: 左文右图 6:4 或 7:3，文本列可加竖线/渐变边框，图列可加淡背景。
- list: 竖向步骤或目录，用数字/点状标记，适合 noir/sapphire 的干净留白。`;

const PRESET_ORDER = Object.keys(STYLE_PRESETS);


const getStylePreset = (presetId: string): StylePreset => {
  const direct = STYLE_PRESETS[presetId];
  if (direct) return direct;
  const emerald = STYLE_PRESETS['emerald-serif'];
  if (emerald) return emerald;
  const first = Object.values(STYLE_PRESETS)[0];
  if (first) return first;
  return {
    id: 'fallback',
    name: 'Fallback',
    accent: '#0f766e',
    border: 'rgba(16,185,129,0.28)',
    surface: 'linear-gradient(135deg, #ecfdf3, #ffffff)',
    summary: 'fallback preset',
    text: '#0f172a',
  };
};

const guessPresetId = (hint?: string) => {
  const normalized = hint?.toLowerCase() ?? '';
  if (normalized.includes('amber') || normalized.includes('retro')) return 'amber-notebook';
  if (normalized.includes('ink') || normalized.includes('contrast') || normalized.includes('noir')) return 'ink-minimal';
  if (normalized.includes('forest') || normalized.includes('green') || normalized.includes('emerald')) return 'emerald-serif';
  if (normalized.includes('sapphire') || normalized.includes('blue')) return 'emerald-serif';
  return 'emerald-serif';
};

const normalizePoints = (rawPoints: unknown): string[] => {
  if (Array.isArray(rawPoints)) {
    return rawPoints.map((item) => (typeof item === 'string' ? item : String(item ?? ''))).filter(Boolean);
  }
  if (typeof rawPoints === 'string') {
    return rawPoints
      .split(/[\n，,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const buildCardsFromJson = (draft: string): SlideCard[] => {
  const parsed = JSON.parse(draft);
  const slides = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.slides) ? parsed.slides : null;
  if (!slides) throw new Error('JSON 顶层需为数组，或 { "slides": [...] }');

  return slides.map((item: unknown, idx: number) => {
    const outline = item as Record<string, unknown>;
    const content = (outline.content ?? {}) as Record<string, unknown>;
    const id = typeof outline.id === 'string' && outline.id ? outline.id : `P${idx + 1}`;
    const title =
      typeof content.title === 'string' && content.title
        ? content.title
        : typeof outline.title === 'string' && outline.title
          ? outline.title
          : `第 ${idx + 1} 页`;
    const contentPoints = normalizePoints(content.points);
    const outlinePoints = normalizePoints(outline.points ?? outline.content);
    const subtitlePoints =
      typeof content.subtitle === 'string' && content.subtitle ? [content.subtitle] : [];
    const points = contentPoints.length
      ? contentPoints
      : outlinePoints.length
        ? outlinePoints
        : subtitlePoints;
    const body = typeof content.body === 'string' && content.body ? content.body : undefined;
    const subtitle = typeof content.subtitle === 'string' && content.subtitle ? content.subtitle : undefined;
    const styleHint =
      typeof outline.theme === 'string'
        ? outline.theme
        : typeof outline.style_hint === 'string'
          ? outline.style_hint
          : typeof outline.styleHint === 'string'
            ? outline.styleHint
            : typeof outline.custom_class === 'string'
              ? outline.custom_class
              : undefined;
    const imageSuggestion =
      typeof content.image_suggestion === 'string'
        ? content.image_suggestion
        : typeof outline.image_suggestion === 'string'
          ? outline.image_suggestion
          : undefined;

    return {
      id,
      type: typeof outline.layout === 'string' ? outline.layout : typeof outline.type === 'string' ? outline.type : undefined,
      title,
      subtitle,
      points: points.length ? points : body ? [body] : [],
      body,
      image_suggestion: imageSuggestion,
      style_hint: styleHint,
      presetId: guessPresetId(styleHint),
      confirmed: false,
      payload: {
        layout: typeof outline.layout === 'string' ? outline.layout : undefined,
        theme: typeof outline.theme === 'string' ? outline.theme : undefined,
        custom_class: typeof outline.custom_class === 'string' ? outline.custom_class : undefined,
        content: {
          title: typeof content.title === 'string' ? content.title : undefined,
          subtitle,
          points: contentPoints.length ? contentPoints : undefined,
          body,
          image_suggestion: imageSuggestion,
        },
      },
    };
  });
};

const mergeClasses = (...parts: Array<string | undefined | null | false>) => parts.filter(Boolean).join(' ');

const themeClassMap: Record<string, string> = {
  noir: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50',
  sapphire: 'bg-gradient-to-br from-sky-900 via-slate-900 to-slate-950 text-slate-50',
  forest: 'bg-gradient-to-br from-emerald-900/80 via-emerald-800 to-emerald-900 text-emerald-50',
  sunset: 'bg-gradient-to-br from-amber-500 via-pink-500 to-rose-500 text-white',
  default: 'bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900',
};

const SlidePlaceholder = () => (
  <div className="w-full h-full grid place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
    等待选中卡片或解析 JSON...
  </div>
);

const SlideSurface = ({ slide }: { slide?: SlideCard | null }) => {
  if (!slide) return <SlidePlaceholder />;

  const layout = (slide.type ?? slide.payload?.layout ?? 'list').toLowerCase();
  const themeKey = (slide.payload?.theme ?? slide.style_hint ?? 'default').toLowerCase();
  const themeClass = themeClassMap[themeKey] ?? themeClassMap.default;
  const custom = slide.payload?.custom_class ?? '';
  const title = slide.title ?? slide.payload?.content?.title ?? '';
  const subtitle = slide.subtitle ?? slide.payload?.content?.subtitle;
  const body = slide.body ?? slide.payload?.content?.body;
  const points = slide.points ?? slide.payload?.content?.points ?? [];
  const imageSuggestion = slide.image_suggestion ?? slide.payload?.content?.image_suggestion;

  const base = mergeClasses(
    'w-full h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col p-12',
    'backdrop-blur',
    themeClass,
    custom
  );

  const LayoutHero = () => (
    <div className={mergeClasses(base, 'justify-between gap-8')}>
      <div className="space-y-4 max-w-5xl">
        <div className="text-xs uppercase tracking-[0.24em] opacity-80">Hero</div>
        <h1 className="text-5xl font-black leading-tight drop-shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
          {title}
        </h1>
        {subtitle ? <p className="text-xl opacity-90 max-w-3xl leading-relaxed">{subtitle}</p> : null}
      </div>
      <div className="flex gap-3 items-center">
        <span className="h-[3px] w-12 bg-white/70 rounded-full" />
        <span className="text-sm font-semibold opacity-80">AI-native presentation</span>
      </div>
    </div>
  );

  const LayoutBento = () => {
    const cells = points.length ? points : [subtitle ?? body ?? '补充要点以填充 bento 卡片'];
    return (
      <div className={mergeClasses(base, 'gap-4')}>
        <div className="flex items-baseline justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] opacity-80">Bento</div>
            <h2 className="text-3xl font-bold">{title}</h2>
          </div>
          <div className="text-sm opacity-80">非对称网格 · 3-5 要点</div>
        </div>
        <div className="grid grid-cols-12 gap-4 flex-1">
          {cells.map((item, idx) => {
            const span = idx === 0 ? 'col-span-7 row-span-2' : idx === 1 ? 'col-span-5' : 'col-span-6';
            return (
              <div
                key={idx}
                className={mergeClasses(
                  'rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm shadow-xl p-5 flex flex-col gap-2',
                  span
                )}
              >
                <div className="text-xs uppercase tracking-[0.18em] opacity-70">Card {idx + 1}</div>
                <div className="text-lg font-semibold leading-snug">{item}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const LayoutSplit = () => (
    <div className={mergeClasses(base, 'grid grid-cols-12 gap-6')}>
      <div className="col-span-7 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg flex flex-col gap-4">
        <div className="text-xs uppercase tracking-[0.2em] opacity-70">Split · Text</div>
        <h2 className="text-3xl font-bold leading-tight">{title}</h2>
        {body ? <p className="text-base leading-relaxed opacity-90">{body}</p> : null}
        <div className="grid gap-3">
          {points.map((pt, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <span className="mt-1 w-2 h-2 rounded-full bg-white/70" />
              <span className="text-base leading-relaxed opacity-95">{pt}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-5">
        <div className="w-full h-full rounded-2xl border border-white/15 bg-white/10 shadow-inner grid place-items-center p-6">
          <div className="w-full h-full rounded-xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 grid place-items-center text-sm text-white/80">
            {imageSuggestion ?? '图像/代码/可视化占位'}
          </div>
        </div>
      </div>
    </div>
  );

  const LayoutList = () => (
    <div className={mergeClasses(base, 'gap-4 justify-center')}>
      <div className="flex items-baseline gap-3">
        <div className="text-xs uppercase tracking-[0.2em] opacity-70">List</div>
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      <div className="space-y-3 max-w-5xl">
        {points.map((pt, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm"
          >
            <div className="mt-1 h-6 w-6 rounded-full border border-white/30 bg-white/10 text-xs grid place-items-center font-semibold">
              {idx + 1}
            </div>
            <div className="text-base leading-relaxed opacity-95">{pt}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (layout === 'hero') return <LayoutHero />;
  if (layout === 'bento') return <LayoutBento />;
  if (layout === 'split') return <LayoutSplit />;
  return <LayoutList />;
};

const ScaledSlidePreview = ({ slide }: { slide?: SlideCard | null }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const baseWidth = 1920;
  const baseHeight = 1080;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const next = Math.min(rect.width / baseWidth, rect.height / baseHeight);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
        boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: 480, overflow: 'hidden', padding: 12, boxSizing: 'border-box' }}
      >
        <div
          style={{
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="origin-top-left"
        >
          <SlideSurface slide={slide} />
        </div>
      </div>
    </div>
  );
};

const StepBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 10,
      border: `1px solid ${active ? 'rgba(16,185,129,0.45)' : 'rgba(214,211,209,0.9)'}`,
      background: active ? 'rgba(16,185,129,0.12)' : '#ffffff',
      color: active ? '#166534' : '#44403c',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: active ? '#22c55e' : '#d6d3d1',
      }}
    />
    {label}
  </div>
);

const OutlineCard = ({
  card,
  onSelect,
  onToggleConfirm,
  isSelected,
}: {
  card: SlideCard;
  isSelected: boolean;
  onSelect: () => void;
  onToggleConfirm: () => void;
}) => {
  const preset = getStylePreset(card.presetId);

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${card.confirmed ? 'rgba(16,185,129,0.45)' : 'rgba(226,232,240,0.9)'}`,
        background: '#ffffff',
        borderRadius: 12,
        padding: 14,
        boxShadow: isSelected ? '0 14px 32px rgba(28,25,23,0.12)' : '0 10px 24px rgba(28,25,23,0.06)',
        cursor: 'pointer',
        display: 'grid',
        gap: 10,
        position: 'relative',
      }}
    >
      {card.confirmed ? (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(16,185,129,0.12)',
            color: '#166534',
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(16,185,129,0.35)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          已锁定
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: preset.surface,
            border: `1px solid ${preset.border}`,
            color: preset.text,
            fontWeight: 800,
          }}
        >
          {card.id}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {card.type ?? 'page'} · {card.points.length} 条要点
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {card.points.map((point, idx) => (
          <div key={idx} style={{ fontSize: 13, color: '#1c1917', display: 'flex', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 7, background: preset.accent }} />
            <span style={{ lineHeight: 1.45 }}>{point}</span>
          </div>
        ))}
      </div>

      {card.image_suggestion ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px dashed rgba(214,211,209,0.9)',
            background: '#f8f8f7',
            color: '#44403c',
            fontSize: 12,
          }}
        >
          图像提示: {card.image_suggestion}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 999,
            background: preset.surface,
            border: `1px solid ${preset.border}`,
            color: preset.text,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: preset.accent,
              boxShadow: `0 0 0 4px ${preset.border}`,
            }}
          />
          {preset.name}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleConfirm();
          }}
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            borderRadius: 10,
            border: `1px solid ${card.confirmed ? 'rgba(16,185,129,0.4)' : '#d6d3d1'}`,
            background: card.confirmed ? 'rgba(16,185,129,0.1)' : '#ffffff',
            color: card.confirmed ? '#166534' : '#1c1917',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {card.confirmed ? '取消锁定' : '锁定卡片'}
        </button>
      </div>
    </div>
  );
};

export default function DeckOutlineDemo() {
  const [jsonDraft, setJsonDraft] = useState<string>(SAMPLE_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [cards, setCards] = useState<SlideCard[]>(() => buildCardsFromJson(SAMPLE_JSON));
  const [selectedId, setSelectedId] = useState<string | null>(cards[0]?.id ?? null);

  const selectedCard = useMemo(() => cards.find((c) => c.id === selectedId) ?? cards[0], [cards, selectedId]);
  const confirmedCount = useMemo(() => cards.filter((c) => c.confirmed).length, [cards]);
  const readyToGenerate = confirmedCount === cards.length && cards.length > 0;
  const activeSlide = selectedCard;

  const handleParseJson = () => {
    try {
      const next = buildCardsFromJson(jsonDraft);
      setCards(next);
      setSelectedId(next[0]?.id ?? null);
      setParseError(null);
    } catch (error: any) {
      setParseError(error?.message ?? 'JSON 解析失败');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f0ef',
        color: '#1c1917',
        padding: '32px 24px 48px',
        display: 'grid',
        gap: 18,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.08em',
              opacity: 0.7,
              textTransform: 'uppercase',
            }}
          >
            Vibe / Deck Outliner
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginTop: 6,
              fontFamily: 'Source Serif 4, serif',
            }}
          >
            AI 结构化 JSON → 卡片大纲 → 样式确认 → 生成
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8, maxWidth: 820, lineHeight: 1.6 }}>
            强 Schema 的 JSON
            输出，前端拆成卡片渲染。样式由前端映射/兜底，暂不开放用户选择，确保最终 PPT
            的审美下限不被拖垮。
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <StepBadge active label="AI JSON" />
          <StepBadge active={cards.length > 0} label="Outline Render" />
          <StepBadge active={confirmedCount > 0} label="Card Review" />
          <StepBadge active={readyToGenerate} label="Ready to Generate" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 16,
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
            display: 'grid',
            gap: 12,
            alignContent: 'start',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>AI 输出的结构化 JSON</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                保持严格 Schema，方便前端无损拆解。
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleParseJson}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #10b981',
                  background: 'rgba(16,185,129,0.12)',
                  color: '#0f172a',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                解析 JSON
              </button>
              <button
                onClick={() => {
                  setJsonDraft(SAMPLE_JSON);
                  setParseError(null);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #d6d3d1',
                  background: '#f8f8f7',
                  color: '#1c1917',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                重置示例
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#0b1220',
              color: '#e2e8f0',
              border: '1px solid #1f2937',
              borderRadius: 12,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {VISUAL_PROTOCOL}
          </div>

          <textarea
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            rows={16}
            spellCheck={false}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #1e293b',
              padding: 14,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 13,
              lineHeight: 1.5,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          />
          {parseError ? (
            <div style={{ color: '#b91c1c', fontSize: 12 }}>解析失败：{parseError}</div>
          ) : (
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              支持 {"{ \"slides\": [...] }"} 结构：每页包含 layout/theme/content（title/points/subtitle/body/image_suggestion）/custom_class。
            </div>
          )}
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 16,
            boxShadow: '0 12px 30px rgba(28,25,23,0.08)',
            display: 'grid',
            gap: 12,
            alignContent: 'start',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>实时预览 / 样式确认</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {confirmedCount}/{cards.length} 已锁定，样式自动匹配。
              </div>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 10,
                border: '1px solid rgba(16,185,129,0.4)',
                background: readyToGenerate ? 'rgba(16,185,129,0.1)' : '#f8f8f7',
                fontSize: 12,
                fontWeight: 700,
                color: readyToGenerate ? '#166534' : '#1c1917',
              }}
            >
              {readyToGenerate ? '准备生成 PPT' : '请先锁定全部卡片'}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Scaling Slide Renderer（16:9，基于 JSON 布局意图）
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              固定基准分辨率 1920×1080，自动计算 scale，支持 layout/theme/custom_class。
            </div>
            <ScaledSlidePreview slide={activeSlide} />
          </div>

          <div
            style={{ display: 'grid', gap: 10, maxHeight: 620, overflow: 'auto', paddingRight: 4 }}
          >
            {cards.map((card) => (
              <OutlineCard
                key={card.id}
                card={card}
                isSelected={selectedCard?.id === card.id}
                onSelect={() => setSelectedId(card.id)}
                onToggleConfirm={() =>
                  setCards((prev) =>
                    prev.map((item) =>
                      item.id === card.id ? { ...item, confirmed: !item.confirmed } : item
                    )
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
