'use client';

import { useMemo, useState } from 'react';

type SlideOutline = {
  id: string;
  type?: string;
  title: string;
  points: string[];
  image_suggestion?: string;
  style_hint?: string;
};

type SlideCard = SlideOutline & {
  presetId: string;
  confirmed: boolean;
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

const SAMPLE_JSON = `[
  {
    "id": "P1",
    "type": "cover",
    "title": "拒绝路人感！3 分钟学会「叙事感」摄影",
    "points": [
      "用故事视角写脚本，而不是堆滤镜",
      "定主角（人物/物件）+ 场景 + 情绪动线"
    ],
    "image_suggestion": "复古胶片相机 + 暖色室内光，浅景深",
    "style_hint": "minimalist, retro_film, serif_headline"
  },
  {
    "id": "P2",
    "type": "agenda",
    "title": "先定调：故事场景三步走",
    "points": [
      "场景: 日常/城市/自然，先定背景色调",
      "主角: 人物站位 + 动作，保持一条情绪线",
      "镜头: 远-中-近三连拍，给出叙事节奏"
    ],
    "style_hint": "emerald, crisp_grid"
  },
  {
    "id": "P3",
    "type": "content",
    "title": "构图速查：情绪导向的 3 套框架",
    "points": [
      "温柔: 大量留白 + 45° 斜光 + 柔焦",
      "力量: 居中对称 + 低机位 + 高对比",
      "日常: 三分法 + 前景遮挡 + 轻微颗粒"
    ],
    "style_hint": "amber, notebook"
  },
  {
    "id": "P4",
    "type": "content",
    "title": "光影脚本：如何让照片有“呼吸感”",
    "points": [
      "选光: 早晚顺光/侧逆光，避免头顶大白光",
      "控暗: 让暗部保留纹理，不要全黑",
      "留空: 画面要有气口，给观众想象空间"
    ],
    "style_hint": "ink, minimal, high_contrast"
  },
  {
    "id": "P5",
    "type": "summary",
    "title": "打包交付：卡片确认后，一键生成",
    "points": [
      "每页的内容、图像提示、风格都被锁定",
      "可替换模板/调色，再点击「生成 PPT」",
      "导出时只读卡片，不再请求 LLM"
    ],
    "style_hint": "emerald, action"
  }
]`;

const PRESET_ORDER = Object.keys(STYLE_PRESETS);

const guessPresetId = (hint?: string) => {
  const normalized = hint?.toLowerCase() ?? '';
  if (normalized.includes('amber') || normalized.includes('retro')) return 'amber-notebook';
  if (normalized.includes('ink') || normalized.includes('contrast')) return 'ink-minimal';
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
  if (!Array.isArray(parsed)) throw new Error('JSON 顶层必须是数组');
  return parsed.map((item, idx) => {
    const outline = item as Record<string, unknown>;
    const id = typeof outline.id === 'string' && outline.id ? outline.id : `P${idx + 1}`;
    const title = typeof outline.title === 'string' && outline.title ? outline.title : `第 ${idx + 1} 页`;
    const points = normalizePoints(outline.points ?? outline.content);
    const styleHint =
      typeof outline.style_hint === 'string'
        ? outline.style_hint
        : typeof outline.styleHint === 'string'
          ? outline.styleHint
          : undefined;

    return {
      id,
      type: typeof outline.type === 'string' ? outline.type : undefined,
      title,
      points,
      image_suggestion: typeof outline.image_suggestion === 'string' ? outline.image_suggestion : undefined,
      style_hint: styleHint,
      presetId: guessPresetId(styleHint),
      confirmed: false,
    };
  });
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
  const preset = STYLE_PRESETS[card.presetId] ?? STYLE_PRESETS['emerald-serif'];

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
              输入数组，每项包含 id/type/title/points/style_hint，可附加 image_suggestion。
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
