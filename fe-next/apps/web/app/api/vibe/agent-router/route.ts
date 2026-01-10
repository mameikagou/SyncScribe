/**
 * Endpoint Description: POST /api/vibe/agent-router，对用户 query 做意图分类，返回 STOCK_QUERY / REPORT_ANALYZE / CHAT。
 * Request Example:
 * { "query": "帮我看下这只股票的财报" }
 * Response Example (200):
 * { "label": "REPORT_ANALYZE", "raw": "REPORT_ANALYZE", "source": "llm" }
 * Response Example (400): { "error": "Missing query" }
 * Test Command:
 * curl -X POST http://localhost:3000/api/vibe/agent-router \
 *   -H "Content-Type: application/json" \
 *   -d '{"query":"帮我看下这只股票的财报"}'
 */
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { deepseek } from '@/lib/ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_LABELS = ['STOCK_QUERY', 'REPORT_ANALYZE', 'CHAT'] as const;
type IntentLabel = (typeof ALLOWED_LABELS)[number];

const SYSTEM_PROMPT =
  '你是一个意图分拣员。根据用户输入，仅返回以下标签之一：[STOCK_QUERY, REPORT_ANALYZE, CHAT]。不要解释，只返回标签。无法确定时返回 CHAT。输出必须是全大写、无标点、无前后缀。';

const normalizeLabel = (raw: string | undefined): IntentLabel | null => {
  if (!raw) return null;
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z_]/g, '');
  const matched = ALLOWED_LABELS.find((label) => cleaned === label || cleaned.includes(label));
  return matched ?? null;
};

const heuristicLabel = (text: string): IntentLabel => {
  const normalized = text.toLowerCase();
  if (/(股价|股票|涨|跌|行情|k线|买入|卖出|交易|pe|市盈率|开盘|收盘|指数)/.test(normalized)) {
    return 'STOCK_QUERY';
  }
  if (/(财报|季报|年报|report|earnings|利润|营收|现金流|毛利|报表|分析)/.test(normalized)) {
    return 'REPORT_ANALYZE';
  }
  return 'CHAT';
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  const { query } = (await req.json().catch(() => ({}))) as { query?: string };

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Missing query' }, { status: 400, headers: corsHeaders });
  }

  let label: IntentLabel = 'CHAT';
  let raw = '';
  let source: 'llm' | 'heuristic' = 'heuristic';

  try {
    const { text } = await generateText({
      model: deepseek.chat('deepseek-chat'),
      system: SYSTEM_PROMPT,
      prompt: query,
      temperature: 0,
      maxOutputTokens: 8,
    });

    raw = text?.trim() ?? '';
    const normalized = normalizeLabel(raw);
    label = normalized ?? heuristicLabel(query);
    source = normalized ? 'llm' : 'heuristic';
  } catch (error) {
    label = heuristicLabel(query);
    raw = 'LLM unavailable';
    source = 'heuristic';
  }

  return NextResponse.json({ label, raw, source }, { headers: corsHeaders });
}
