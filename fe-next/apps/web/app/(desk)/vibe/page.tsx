'use client';

import { AnimatePresence, LayoutGroup, motion, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, FlameKindling, ListTree, Sparkles, Wand2, Waves, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Scene = {
  key: string;
  title: string;
  summary: string;
  steps: string[];
  accent: 'emerald' | 'amber';
};

const scenes: Scene[] = [
  {
    key: 'flow',
    title: 'Flow Orchestrator',
    summary: '基于 stagger + spring 的多段编舞，让“思考 → 生成 → 校对”一气呵成。',
    accent: 'emerald',
    steps: [
      '初稿生成：0.18s 延迟逐段显露，保持节奏感',
      '事实校对：小幅位移 + 低阻尼弹簧，突出编辑动作',
      '最终定稿：淡入阴影，形成“落笔”瞬间',
    ],
  },
  {
    key: 'presence',
    title: 'Spatial Presence',
    summary: 'AnimatePresence 处理章节增删，纸张高度与阴影实时重排，零白屏。',
    accent: 'amber',
    steps: [
      '章节切换：交叉渐隐，避免突兀跳动',
      '纸张重排：layoutId 保持阅读焦点不漂移',
      '余晖拖尾：低频透明度振荡，强化“余温”感',
    ],
  },
  {
    key: 'parallax',
    title: 'Analog Parallax',
    summary: 'Pointer-based parallax + 细粒度模糊，呈现“书页轻拱”的真实质感。',
    accent: 'emerald',
    steps: [
      'X/Y parallax：根据指针偏移转换为 rotateX/rotateY',
      '墨迹高光：高光锥随鼠标移动，模拟纸纤维反光',
      '深度分层：浮动卡片和刻度条分别使用不同阻尼',
    ],
  },
];

const techniques = [
  {
    title: 'LayoutGroup + AnimatePresence',
    desc: '重排与进出场共享 layoutId，实现无感衔接的结构变换。',
  },
  {
    title: 'MotionValue Parallax',
    desc: '基于指针位置驱动 rotate / translate，纸张微拱且可控收敛。',
  },
  {
    title: 'Viewport 触发',
    desc: 'whileInView + once 组合，滚动时按节拍进入，避免多次抖动。',
  },
  {
    title: 'Spring 曲线精调',
    desc: 'stiffness / damping 分层设置，强调“落笔”“翻页”差异感。',
  },
];

const heroHighlights = [
  '低饱和石质色盘，强调纸张与墨迹对比',
  '纸面阴影 shadow-page，保持 desk 背景的留白呼吸',
  'Serif 叙事 + Sans UI，保持权威又不失克制',
];

export default function VibeLanding() {
  const [activeScene, setActiveScene] = useState<Scene>(scenes[0]);

  const floatingBadges = useMemo(
    () => [
      { label: 'Layout-aware', delay: 0 },
      { label: 'Spring tuned', delay: 0.6 },
      { label: 'Subtle glow', delay: 1.2 },
    ],
    []
  );

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-desk text-ink">
      <div className="max-w-6xl mx-auto px-4 lg:px-10 py-10 space-y-10">
        <header className="space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500 font-sans">
            Vibe · Motion Showcase
          </p>
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight">
              纸张上的动态叙事，榫卯级细节
            </h1>
            <p className="text-lg text-stone-600 max-w-3xl font-sans leading-relaxed">
              以 framer-motion 解锁“纸张 + 桌面”的物理隐喻：柔和的拱度、精准的落笔、克制的光感。
              一切动效都服务于阅读节奏，而非噱头。
            </p>
          </div>
        </header>

        <motion.section className="relative bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md overflow-hidden">
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(120deg, rgba(16,185,129,0.06), rgba(255,255,255,0) 35%, rgba(234,179,8,0.05))',
              backgroundSize: '200% 200%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div className="relative px-6 md:px-10 py-10 grid md:grid-cols-[1.2fr,1fr] gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-action/10 px-3 py-1 text-xs font-semibold text-action">
                  <Sparkles size={14} />
                  Motion-first desk
                </div>
                <h2 className="text-3xl font-serif font-semibold">向前看的首页动效蓝本</h2>
                <p className="text-base text-stone-600 font-sans leading-relaxed">
                  每个区块都有节奏化的入场与扫光，核心强调布局动画、Presence、Spring 精调与滚动时序控制。
                  全部动效围绕“纸张/桌面”隐喻，保持克制而可感知。
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {heroHighlights.map((item) => (
                  <motion.div
                    key={item}
                    className="h-full rounded-md border border-ink-faint bg-white shadow-sm p-4 text-sm text-ink/80 font-sans"
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-action text-white font-semibold shadow-sm"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  立即预览
                  <ArrowRight size={16} />
                </motion.div>
                <div className="flex items-center gap-2 text-sm text-stone-500 font-sans">
                  <Waves size={16} className="text-action" />
                  无闪烁、无霓虹，纯物理隐喻。
                </div>
              </div>
            </div>

            <div className="relative">
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(220px circle at 35% 22%, rgba(234,179,8,0.08), transparent 60%)',
                  filter: 'blur(18px)',
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative space-y-4">
                <motion.div
                  className="rounded-lg border border-ink-faint bg-white shadow-card p-5"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className="flex items-center justify-between text-sm text-stone-500 font-sans">
                    <span>稿件推进</span>
                    <span className="inline-flex items-center gap-1 text-action font-semibold">
                      <Sparkles size={14} />
                      实时
                    </span>
                  </div>
                  <motion.div
                    className="mt-4 h-2 w-full rounded-full bg-stone-100 overflow-hidden"
                    initial={{ scaleX: 0.7, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                  >
                    <motion.div
                      className="h-full bg-action"
                      animate={{ width: ['48%', '76%', '64%', '86%'] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <div className="mt-4 space-y-2">
                    {['提纲·序言', '论据梳理', '交叉校对'].map((step, index) => (
                      <motion.div
                        key={step}
                        className="flex items-center gap-3 text-sm text-ink/80 font-sans"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 220, damping: 18 }}
                      >
                        <span className="h-2 w-2 rounded-full bg-action" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-lg border border-ink-faint bg-white shadow-card p-5 relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-500 font-semibold font-sans">
                    <ListTree size={14} />
                    Motion Timeline
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm font-sans">
                    {['Layout', 'Presence', 'Physics'].map((label, index) => (
                      <motion.div
                        key={label}
                        className="rounded-md border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-ink/80"
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{label}</span>
                          <FlameKindling size={14} className="text-amber-500" />
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-stone-200 overflow-hidden">
                          <motion.div
                            className="h-full bg-amber-500/80"
                            animate={{ width: ['42%', '86%', '64%'] }}
                            transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs text-stone-500">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    使用 layoutId 保证章节跳转时阅读焦点不漂移。
                  </div>
                  <AnimatePresence>
                    {floatingBadges.map((badge) => (
                      <motion.div
                        key={badge.label}
                        className="absolute px-2 py-1 rounded-md border border-stone-200 bg-white text-[11px] font-semibold text-stone-600 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.9, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          delay: 0.5 + badge.delay,
                          duration: 0.8,
                          repeat: Infinity,
                          repeatType: 'mirror',
                        }}
                        style={{
                          top: `${28 + badge.delay * 12}%`,
                          right: `${14 + badge.delay * 10}%`,
                        }}
                      >
                        {badge.label}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <LayoutGroup>
          <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500 font-sans">
                  Motion Playbook
                </p>
                <h3 className="text-2xl font-serif font-semibold">核心动效场景</h3>
              </div>
              <div className="text-sm text-stone-600 font-sans max-w-lg">
                通过 LayoutGroup + AnimatePresence 把多段状态拼成一张纸上的“连续动作”。下方场景可切换，内容区随之重排。
              </div>
            </div>

            <div className="grid md:grid-cols-[0.9fr,1.1fr] gap-6">
              <div className="space-y-3">
                {scenes.map((scene) => (
                  <motion.button
                    key={scene.key}
                    layoutId={`scene-${scene.key}`}
                    onClick={() => setActiveScene(scene)}
                    className={`w-full text-left rounded-md border transition-colors px-4 py-3 ${
                      activeScene.key === scene.key
                        ? 'border-action bg-action/10 text-action'
                        : 'border-stone-200/80 bg-white text-ink'
                    }`}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{scene.title}</span>
                      <span
                        className={`text-xs font-bold uppercase tracking-[0.16em] ${
                          scene.accent === 'emerald' ? 'text-action' : 'text-amber-600'
                        }`}
                      >
                        {scene.accent === 'emerald' ? 'Flow' : 'Presence'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600 font-sans">{scene.summary}</p>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene.key}
                  layout
                  className="rounded-md border border-stone-200/80 bg-white shadow-card p-6 space-y-4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className="flex items-center gap-2 text-sm font-sans text-stone-600">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activeScene.accent === 'emerald' ? 'bg-action' : 'bg-amber-500'
                      }`}
                    />
                    {activeScene.title}
                  </div>
                  <p className="text-base text-ink font-serif leading-relaxed">{activeScene.summary}</p>
                  <div className="space-y-2">
                    {activeScene.steps.map((step, index) => (
                      <motion.div
                        key={step}
                        className="flex items-start gap-3 rounded-md border border-ink-faint bg-stone-50/70 px-3 py-2"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + index * 0.05, type: 'spring', stiffness: 240, damping: 22 }}
                      >
                        <span className="mt-[6px] h-2 w-2 rounded-full bg-ink/50" />
                        <span className="text-sm text-ink/80 font-sans">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-action" />
                      兼容 SSR，动画逻辑只在 client 运行
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight size={12} />
                      LayoutGroup = 连续叙事
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </LayoutGroup>

        <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500 font-sans">
                Techniques
              </p>
              <h3 className="text-2xl font-serif font-semibold">Motion Tooling 一览</h3>
            </div>
            <p className="text-sm text-stone-600 font-sans max-w-xl">
              组合使用 whileInView、spring 曲线、MotionValue，演示 framer-motion 在桌面隐喻下的可控极限。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {techniques.map((tech, idx) => (
              <motion.div
                key={tech.title}
                className="rounded-md border border-ink-faint bg-white shadow-sm p-4 space-y-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 14 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 220, damping: 20 }}
                viewport={{ once: true, margin: '-10%' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{tech.title}</span>
                  <motion.div
                    className="h-6 w-6 rounded-full bg-action/10 flex items-center justify-center text-action"
                    animate={{ rotate: [0, 8, 0] }}
                    transition={{ duration: 3 + idx, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <FlameKindling size={14} />
                  </motion.div>
                </div>
                <p className="text-sm text-stone-600 font-sans leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="relative overflow-hidden rounded-md border border-stone-200/80 bg-white shadow-card p-6"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 20% 30%, rgba(16,185,129,0.08), transparent 45%)' }}
              animate={{ opacity: [0.6, 0.85, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <FlameKindling size={14} />
                  高级动效配方
                </div>
                <h4 className="text-xl font-serif font-semibold">Desk / Paper / Bookends 全栈呈现</h4>
                <p className="text-sm text-stone-600 font-sans max-w-2xl">
                  纸张保持 rounded-md，避免“圆润可爱”。阴影使用 shadow-page，呈现漂浮的物理质感。
                  所有颜色落在 Stone + Emerald + Amber 的语义域内。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md border border-stone-200/80 bg-paper shadow-sm flex items-center justify-center">
                  <Sparkles className="text-action" size={18} />
                </div>
                <div className="text-sm text-stone-600 font-sans">
                  <div className="font-semibold text-ink">No neon, no glassmorphism</div>
                  <div>只保留纸张的反光、桌面的留白。</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

const orbitDots = [
  { delay: 0, color: 'rgba(16,185,129,0.8)', size: 10 },
  { delay: 0.4, color: 'rgba(234,179,8,0.75)', size: 8 },
  { delay: 0.8, color: 'rgba(28,25,23,0.6)', size: 12 },
];

const microBadges = [
  { label: 'Parallax Desk', tone: 'emerald' },
  { label: 'Spring-tuned CTA', tone: 'amber' },
  { label: 'Analog Glow', tone: 'ink' },
];

// Aurora 版首页：大 Logo + 双按钮 + 桌面物理感
export function VibeLandingAurora() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      x.set(event.clientX / innerWidth - 0.5);
      y.set(event.clientY / innerHeight - 0.5);
    };

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [x, y]);

  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const glowX = useTransform(x, [-0.5, 0.5], ['15%', '85%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['10%', '90%']);
  const radial = useMotionTemplate`radial-gradient(340px circle at ${glowX} ${glowY}, rgba(16,185,129,0.18), transparent 60%)`;

  return (
    <div className="min-h-screen bg-desk text-ink font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{ background: radial }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(260px circle at 20% 22%, rgba(234,179,8,0.12), transparent 55%), radial-gradient(240px circle at 78% 32%, rgba(16,185,129,0.12), transparent 55%)',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-14 space-y-14">
        <header className="flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 px-3 py-1 text-xs font-semibold">
            <Sparkles size={14} />
            Framer Motion · Desk Vibe
          </div>
          <motion.h1
            className="text-5xl md:text-6xl font-serif font-semibold tracking-tight leading-tight"
            style={{ rotateX, rotateY }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            SyncScribe Motion Desk
          </motion.h1>
          <p className="max-w-2xl text-base md:text-lg text-stone-600 leading-relaxed">
            大尺寸 Logo、纸张质感的浮层、精准的 spring 曲线。用一次 Hero 展示 framer-motion 能达到的“桌面物理极限”，无霓虹、全克制。
          </p>
          <div className="flex items-center gap-4">
            <motion.button
              className="inline-flex items-center gap-2 rounded-md bg-action text-white px-5 py-3 font-semibold shadow-lg shadow-emerald-200"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              立即体验
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-5 py-3 font-semibold text-ink shadow-sm"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              查看动效谱
            </motion.button>
          </div>
        </header>

        <motion.section
          className="relative bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md overflow-hidden"
          style={{ rotateX, rotateY }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="absolute inset-px rounded-[10px] pointer-events-none"
            style={{
              background:
                'linear-gradient(120deg, rgba(16,185,129,0.08), rgba(255,255,255,0), rgba(234,179,8,0.1))',
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative px-8 md:px-12 py-12 grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-action/10 text-action px-3 py-1 text-xs font-semibold">
                <Wand2 size={14} />
                Motion Capabilities
              </div>
              <h2 className="text-3xl font-serif font-semibold">一屏呈现桌面隐喻的物理上限</h2>
              <p className="text-base text-stone-600 leading-relaxed">
                通过 pointer parallax、Layout-aware 扫光、spring 精调，强调“纸张漂浮于桌面”的空间感。辅以微型徽章展示，不用大量卡片也能覆盖关键效果。
              </p>
              <div className="flex flex-wrap gap-3">
                {microBadges.map((item) => (
                  <motion.div
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-md border border-ink-faint bg-white px-3 py-2 text-sm font-semibold shadow-sm"
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 230, damping: 20 }}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.tone === 'emerald'
                          ? 'bg-action'
                          : item.tone === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-ink/70'
                      }`}
                    />
                    {item.label}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: radial }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative aspect-[4/3] rounded-xl border border-stone-200/80 bg-white shadow-[0px_24px_60px_rgba(0,0,0,0.12)] overflow-hidden"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(300px circle at 20% 20%, rgba(16,185,129,0.08), transparent 55%), radial-gradient(260px circle at 72% 60%, rgba(234,179,8,0.08), transparent 50%)',
                  }}
                  animate={{ opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="absolute inset-8 rounded-lg border border-ink-faint bg-paper/80 backdrop-blur">
                  <motion.div
                    className="absolute inset-0"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                    style={{
                      background:
                        'linear-gradient(120deg, rgba(28,25,23,0.05), rgba(255,255,255,0), rgba(16,185,129,0.08), rgba(255,255,255,0), rgba(234,179,8,0.08))',
                      backgroundSize: '220% 220%',
                    }}
                  />

                  <div className="relative h-full w-full flex items-center justify-center">
                    <motion.div
                      className="relative h-40 w-40 rounded-full border border-stone-200/80 bg-white shadow-card flex items-center justify-center"
                      style={{ rotateX, rotateY }}
                      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    >
                      <motion.div
                        className="absolute inset-4 rounded-full bg-gradient-to-br from-action/20 via-white to-amber-200/30 blur-2xl"
                        animate={{ scale: [0.96, 1.04, 0.96] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative flex flex-col items-center gap-1">
                        <span className="text-xs uppercase tracking-[0.22em] text-stone-500 font-semibold">
                          SyncScribe
                        </span>
                        <motion.div
                          className="text-3xl font-serif font-semibold text-ink"
                          animate={{ letterSpacing: ['0.04em', '0.08em', '0.04em'] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          Vibe
                        </motion.div>
                        <span className="text-[11px] text-stone-500 font-semibold">framer-motion</span>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    >
                      {orbitDots.map((dot, idx) => (
                        <motion.span
                          key={dot.color}
                          className="absolute rounded-full shadow-sm"
                          style={{
                            width: dot.size,
                            height: dot.size,
                            background: dot.color,
                            top: '50%',
                            left: '50%',
                            marginLeft: -dot.size / 2,
                            marginTop: -dot.size / 2,
                          }}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1.1 }}
                          transition={{
                            duration: 2 + idx * 0.4,
                            delay: dot.delay,
                            repeat: Infinity,
                            repeatType: 'mirror',
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </motion.div>

                    <motion.div
                      className="absolute left-10 top-10 text-sm font-semibold text-ink/70 bg-white/80 border border-ink-faint rounded-md px-3 py-2 shadow-sm backdrop-blur"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 230, damping: 20 }}
                    >
                      LayoutGroup · 无白屏过渡
                    </motion.div>
                    <motion.div
                      className="absolute right-12 bottom-12 text-sm font-semibold text-ink/70 bg-white/80 border border-ink-faint rounded-md px-3 py-2 shadow-sm backdrop-blur"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, type: 'spring', stiffness: 230, damping: 20 }}
                    >
                      Presence · 章节增删无抖动
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <section className="bg-paper shadow-page ring-1 ring-stone-200/70 rounded-md px-6 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500 font-semibold">Motion Stack</p>
              <h3 className="text-2xl font-serif font-semibold">最少元素，最大表现</h3>
            </div>
            <div className="text-sm text-stone-600 max-w-xl">
              主视觉 + 双按钮 + 徽章即可覆盖 framer-motion 的高阶能力：parallax、spring、Presence、radial glow、CTA 微交互。
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { title: 'Parallax Desk', desc: '鼠标驱动的 rotateX/rotateY，让纸张拱起。' },
              { title: 'Spring Buttons', desc: '主按钮用高刚度低阻尼，次按钮保持轻盈。' },
              { title: 'Analog Glow', desc: '遵循纸张反光，用 radial glow 替代霓虹。' },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                className="rounded-md border border-ink-faint bg-white shadow-sm p-4 space-y-2"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 220, damping: 20 }}
              >
                <div className="inline-flex items-center gap-2 rounded-md bg-action/10 text-action px-2 py-1 text-xs font-semibold">
                  <Zap size={14} />
                  {item.title}
                </div>
                <p className="text-sm text-stone-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
