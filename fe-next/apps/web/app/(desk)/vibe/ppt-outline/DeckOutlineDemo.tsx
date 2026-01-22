'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SlideTemplateKey = 'cover-hero' | 'bento-feature' | 'split-narrative' | 'checklist-steps';

type SlideTemplateVars = {
  kicker?: string;
  heading?: string;
  subheading?: string;
  tagline?: string;
  body?: string;
  bullets?: string[];
  steps?: string[];
  note?: string;
  badge?: string;
  media_prompt?: string;
};

type SlideCard = {
  id: string;
  template: SlideTemplateKey;
  theme?: string;
  className?: string;
  presetId: string;
  confirmed: boolean;
  vars: SlideTemplateVars;
  previewPoints: string[];
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

type SlideTemplateDefinition = {
  key: SlideTemplateKey;
  name: string;
  description: string;
  component: (props: { slide: SlideCard; baseClass: string }) => JSX.Element;
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
  "meta": {
    "deck_title": "叙事感摄影工作坊",
    "preset": "emerald-serif",
    "tone": "serif + gradient"
  },
  "slides": [
    {
      "id": "S1",
      "template": "cover-hero",
      "theme": "noir",
      "class_name": "bg-stone-950 text-white tracking-widest font-serif",
      "vars": {
        "kicker": "入门 Workshop",
        "heading": "拒绝路人感",
        "subheading": "3 分钟学会「叙事感」摄影技巧",
        "tagline": "AI-native presentation"
      }
    },
    {
      "id": "S2",
      "template": "bento-feature",
      "theme": "sapphire",
      "class_name": "border border-blue-500/20 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)]",
      "vars": {
        "badge": "Bento",
        "heading": "构图三要素",
        "bullets": [
          "留白与三分法",
          "黄金时刻光影",
          "引导线应用"
        ],
        "note": "非对称网格，3-5 个要点即可"
      }
    },
    {
      "id": "S3",
      "template": "split-narrative",
      "theme": "forest",
      "class_name": "rounded-tl-[5rem] bg-gradient-to-br from-emerald-50 to-white",
      "vars": {
        "heading": "光线捕捉",
        "body": "学会给画面做减法，利用光线捕捉情绪。黄金时刻是避开正午的最佳选择。",
        "bullets": [
          "避开正午直射，保留柔和层次",
          "优先选择侧逆光，勾勒主体边缘"
        ],
        "media_prompt": "一张极简风格照片，侧逆光勾勒发丝"
      }
    },
    {
      "id": "S4",
      "template": "checklist-steps",
      "theme": "ink-minimal",
      "vars": {
        "kicker": "拍摄 Checklist",
        "heading": "快速复盘",
        "steps": [
          "确认主角与故事感，避免路人视角",
          "三脚架 / 快门遥控器，确保稳定",
          "预留留白，方便后期文字排布"
        ],
        "note": "锁定后即可交给生成端做模板填充"
      }
    }
  ]
}`;

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
  if (normalized.includes('ink') || normalized.includes('contrast') || normalized.includes('noir'))
    return 'ink-minimal';
  if (
    normalized.includes('forest') ||
    normalized.includes('green') ||
    normalized.includes('emerald')
  )
    return 'emerald-serif';
  if (normalized.includes('sapphire') || normalized.includes('blue')) return 'emerald-serif';
  return PRESET_ORDER[0] ?? 'emerald-serif';
};

const normalizeStringArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')).trim())
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[\n，,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeTemplateKey = (raw?: string): SlideTemplateKey => {
  const normalized = (raw ?? '').toLowerCase();
  if (normalized.includes('hero') || normalized === 'hero' || normalized === 'cover')
    return 'cover-hero';
  if (normalized.includes('bento')) return 'bento-feature';
  if (normalized.includes('split')) return 'split-narrative';
  return 'checklist-steps';
};

const buildCardsFromJson = (draft: string): SlideCard[] => {
  const parsed = JSON.parse(draft);
  const slides = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.slides)
      ? parsed.slides
      : null;
  if (!slides) throw new Error('JSON 顶层需为数组，或 { "slides": [...] }');

  return slides.map((item: unknown, idx: number) => {
    const outline = (item ?? {}) as Record<string, unknown>;
    const varsRaw =
      (outline.vars as Record<string, unknown> | undefined) ??
      (outline.content as Record<string, unknown> | undefined) ??
      {};

    const heading =
      typeof varsRaw?.heading === 'string' && varsRaw.heading
        ? varsRaw.heading
        : typeof varsRaw?.title === 'string' && varsRaw.title
          ? varsRaw.title
          : typeof outline.title === 'string' && outline.title
            ? outline.title
            : `第 ${idx + 1} 页`;
    const subheading =
      typeof varsRaw?.subheading === 'string' && varsRaw.subheading
        ? varsRaw.subheading
        : typeof outline.subtitle === 'string' && outline.subtitle
          ? outline.subtitle
          : undefined;
    const bullets = normalizeStringArray(varsRaw?.bullets ?? varsRaw?.points ?? outline.points);
    const steps = normalizeStringArray(varsRaw?.steps);
    const body =
      typeof varsRaw?.body === 'string' && varsRaw.body
        ? varsRaw.body
        : typeof outline.body === 'string' && outline.body
          ? outline.body
          : undefined;
    const mediaPrompt =
      typeof varsRaw?.media_prompt === 'string' && varsRaw.media_prompt
        ? varsRaw.media_prompt
        : typeof outline.image_suggestion === 'string' && outline.image_suggestion
          ? outline.image_suggestion
          : undefined;
    const note =
      typeof varsRaw?.note === 'string' && varsRaw.note
        ? varsRaw.note
        : typeof outline.style_hint === 'string' && outline.style_hint
          ? outline.style_hint
          : undefined;

    const template = normalizeTemplateKey(
      typeof outline.template === 'string'
        ? outline.template
        : typeof outline.layout === 'string'
          ? outline.layout
          : undefined
    );

    const id =
      typeof outline.id === 'string' && outline.id && outline.id.trim()
        ? outline.id.trim()
        : `P${idx + 1}`;

    const className =
      typeof outline.class_name === 'string' && outline.class_name
        ? outline.class_name
        : typeof outline.custom_class === 'string' && outline.custom_class
          ? outline.custom_class
          : undefined;

    const previewPoints = steps.length
      ? steps
      : bullets.length
        ? bullets
        : body
          ? [body]
          : subheading
            ? [subheading]
            : [];

    return {
      id,
      template,
      theme: typeof outline.theme === 'string' ? outline.theme : undefined,
      className,
      presetId: guessPresetId(
        typeof outline.preset === 'string' ? outline.preset : typeof outline.theme === 'string' ? outline.theme : className
      ),
      confirmed: false,
      vars: {
        kicker: typeof varsRaw?.kicker === 'string' ? varsRaw.kicker : undefined,
        heading,
        subheading,
        tagline: typeof varsRaw?.tagline === 'string' ? varsRaw.tagline : undefined,
        body,
        bullets,
        steps,
        note,
        badge: typeof varsRaw?.badge === 'string' ? varsRaw.badge : undefined,
        media_prompt: mediaPrompt,
      },
      previewPoints,
    };
  });
};

const mergeClasses = (...parts: Array<string | undefined | null | false>) =>
  parts.filter(Boolean).join(' ');

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

type TemplateProps = { slide: SlideCard; baseClass: string };

const CoverHero = ({ slide, baseClass }: TemplateProps) => (
  <div className={mergeClasses(baseClass, 'justify-between gap-8')}>
    <div className="space-y-4 max-w-5xl">
      <div className="text-xs uppercase tracking-[0.24em] opacity-80">
        {slide.vars.kicker ?? 'Hero'}
      </div>
      <h1 className="text-5xl font-black leading-tight drop-shadow-[0_12px_36px_rgba(0,0,0,0.3)]">
        {slide.vars.heading}
      </h1>
      {slide.vars.subheading ? (
        <p className="text-xl opacity-90 max-w-3xl leading-relaxed">{slide.vars.subheading}</p>
      ) : null}
    </div>
    <div className="flex gap-3 items-center">
      <span className="h-[3px] w-12 bg-white/70 rounded-full" />
      <span className="text-sm font-semibold opacity-80">
        {slide.vars.tagline ?? 'AI-native presentation'}
      </span>
    </div>
  </div>
);

const BentoFeature = ({ slide, baseClass }: TemplateProps) => {
  const cells = slide.vars.bullets?.length
    ? slide.vars.bullets
    : ['补充要点以填充 bento 卡片', '点击锁定后会带入生成端', slide.vars.note ?? ''];
  return (
    <div className={mergeClasses(baseClass, 'gap-4')}>
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.18em] opacity-80">
            {slide.vars.badge ?? 'Bento'}
          </div>
          <h2 className="text-3xl font-bold">{slide.vars.heading}</h2>
        </div>
        <div className="text-sm opacity-80">{slide.vars.note ?? '非对称网格 · 3-5 要点'}</div>
      </div>
      <div className="grid grid-cols-12 gap-4 flex-1">
        {cells.map((item, idx) => {
          const span =
            idx === 0 ? 'col-span-7 row-span-2' : idx === 1 ? 'col-span-5' : 'col-span-6';
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

const SplitNarrative = ({ slide, baseClass }: TemplateProps) => (
  <div className={mergeClasses(baseClass, 'grid grid-cols-12 gap-6')}>
    <div className="col-span-7 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg flex flex-col gap-4">
      <div className="text-xs uppercase tracking-[0.2em] opacity-70">Split · Text</div>
      <h2 className="text-3xl font-bold leading-tight">{slide.vars.heading}</h2>
      {slide.vars.body ? <p className="text-base leading-relaxed opacity-90">{slide.vars.body}</p> : null}
      <div className="grid gap-3">
        {(slide.vars.bullets ?? []).map((pt, idx) => (
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
          {slide.vars.media_prompt ?? '图像/代码/可视化占位'}
        </div>
      </div>
    </div>
  </div>
);

const ChecklistSteps = ({ slide, baseClass }: TemplateProps) => {
  const steps = slide.vars.steps?.length ? slide.vars.steps : slide.vars.bullets ?? [];
  return (
    <div className={mergeClasses(baseClass, 'gap-4 justify-center')}>
      <div className="flex items-baseline gap-3">
        <div className="text-xs uppercase tracking-[0.2em] opacity-70">
          {slide.vars.kicker ?? 'List'}
        </div>
        <h2 className="text-3xl font-bold">{slide.vars.heading}</h2>
      </div>
      <div className="space-y-3 max-w-5xl">
        {steps.map((pt, idx) => (
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
      {slide.vars.note ? (
        <div className="text-sm opacity-80 border border-white/10 bg-white/5 rounded-2xl px-4 py-3">
          {slide.vars.note}
        </div>
      ) : null}
    </div>
  );
};

const SLIDE_TEMPLATES: Record<SlideTemplateKey, SlideTemplateDefinition> = {
  'cover-hero': {
    key: 'cover-hero',
    name: '封面 Hero',
    description: '大标题 + 副标题 + tagline，突出开场气质',
    component: CoverHero,
  },
  'bento-feature': {
    key: 'bento-feature',
    name: 'Bento Feature',
    description: '非对称卡片网格，承载 3-5 个要点或例子',
    component: BentoFeature,
  },
  'split-narrative': {
    key: 'split-narrative',
    name: 'Split Narrative',
    description: '左右分栏：文字叙事 + 媒体提示',
    component: SplitNarrative,
  },
  'checklist-steps': {
    key: 'checklist-steps',
    name: 'Checklist',
    description: '序列化 checklist / 要点列表',
    component: ChecklistSteps,
  },
};

const SlideSurface = ({ slide }: { slide?: SlideCard | null }) => {
  if (!slide) return <SlidePlaceholder />;
  const template = SLIDE_TEMPLATES[slide.template] ?? SLIDE_TEMPLATES['checklist-steps'];

  const themeKey = (slide.theme ?? 'default').toLowerCase();
  const themeClass = themeClassMap[themeKey] ?? themeClassMap.default;
  const base = mergeClasses(
    'w-full h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col p-12 backdrop-blur',
    themeClass,
    slide.className
  );

  const TemplateComponent = template.component;
  return <TemplateComponent slide={slide} baseClass={base} />;
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
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
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
  const template = SLIDE_TEMPLATES[card.template];

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${card.confirmed ? 'rgba(16,185,129,0.45)' : 'rgba(226,232,240,0.9)'}`,
        background: '#ffffff',
        borderRadius: 12,
        padding: 14,
        boxShadow: isSelected
          ? '0 14px 32px rgba(28,25,23,0.12)'
          : '0 10px 24px rgba(28,25,23,0.06)',
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {card.vars.heading}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {template?.name ?? 'Template'} · {card.previewPoints.length} 条要点
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {card.previewPoints.map((point, idx) => (
          <div key={idx} style={{ fontSize: 13, color: '#1c1917', display: 'flex', gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                marginTop: 7,
                background: preset.accent,
              }}
            />
            <span style={{ lineHeight: 1.45 }}>{point}</span>
          </div>
        ))}
      </div>

      {card.vars.media_prompt ? (
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
          媒体提示: {card.vars.media_prompt}
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

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedId) ?? cards[0],
    [cards, selectedId]
  );
  const confirmedCount = useMemo(() => cards.filter((c) => c.confirmed).length, [cards]);
  const readyToGenerate = confirmedCount === cards.length && cards.length > 0;

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
            AI 结构化 JSON → 模板变量 → 卡片渲染 → 样式锁定
          </div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8, maxWidth: 820, lineHeight: 1.6 }}>
            以模板为中心的 JSON Schema：每页指定 template + vars，前端映射为固定版式，锁定后即可把变量传给生成端。
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
          <StepBadge active label="AI JSON" />
          <StepBadge active={cards.length > 0} label="Outline Render" />
          <StepBadge active={confirmedCount > 0} label="Card Review" />
          <StepBadge active={readyToGenerate} label="Ready to Generate" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr', gap: 14 }}>
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>AI 输出的模板化 JSON</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                统一 template + vars 结构，便于生成端直接填充版式变量。
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
              新 Schema：每页需要 <code>template</code>（cover-hero/bento-feature/split-narrative/checklist-steps）
              与 <code>vars</code>（heading/subheading/bullets/steps/body/media_prompt...）。兼容旧的 layout/content 字段。
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>实时预览 / 模板确认</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {confirmedCount}/{cards.length} 已锁定，模板字段将直接下发给生成端。
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

          <div
            style={{
              display: 'grid',
              gap: 14,
              maxHeight: 920,
              overflow: 'auto',
              paddingRight: 4,
            }}
          >
            {cards.map((card) => (
              <div key={card.id} style={{ display: 'grid', gap: 10 }}>
                <ScaledSlidePreview slide={card} />
                <OutlineCard
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
