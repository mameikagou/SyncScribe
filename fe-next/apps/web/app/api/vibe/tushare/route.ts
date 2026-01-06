import { NextResponse } from 'next/server';

const TUSHARE_TOKEN = process.env.TUSHARE;

if (!TUSHARE_TOKEN) {
  throw new Error('Missing TUSHARE environment variable');
}

type TushareRequestBody = {
  api_name?: string;
  params?: Record<string, unknown>;
  fields?: string;
};
// 这傻逼接口一小时一次，懒得折腾它了
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TushareRequestBody;

  const apiName = body.api_name ?? 'stock_basic';
  const params = body.params ?? { list_status: 'L' };
  const fields = body.fields ?? 'ts_code,name,area,industry,list_date';

  const payload = {
    api_name: apiName,
    token: TUSHARE_TOKEN,
    params,
    fields,
  };

  const response = await fetch('http://api.tushare.pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to reach Tushare', status: response.status },
      { status: 502 },
    );
  }

  const result = await response.json();

  // Tushare uses code === 0 for success
  if (result?.code && result.code !== 0) {
    return NextResponse.json(
      { error: result?.msg ?? 'Tushare responded with an error', detail: result },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}


// curl -X POST http://localhost:3000/api/vibe/tushare -H
//     'Content-Type: application/json' -d '{"params":
//     {"list_status":"L"},"fields":"ts_code,name,area,industry,list_date"}'.