import { NextResponse } from 'next/server';

import {
  McpRequestEnvelope,
  executeMcpAction,
  getRegisteredMcpActions,
} from '@/lib/mcp';

const parseRequestBody = async (request: Request): Promise<McpRequestEnvelope | null> => {
  try {
    const data = (await request.json()) as McpRequestEnvelope;
    return data;
  } catch (error) {
    console.error('Failed to parse MCP request body:', error);
    return null;
  }
};

export async function GET() {
  return NextResponse.json({
    node: 'mcp',
    status: 'ready',
    availableActions: getRegisteredMcpActions(),
  });
}

export async function POST(request: Request) {
  const body = await parseRequestBody(request);

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const action = typeof body.action === 'string' ? body.action.trim() : '';

  if (!action) {
    return NextResponse.json({ error: 'Missing `action` in MCP payload' }, { status: 400 });
  }

  const response = await executeMcpAction(action, body.payload ?? {}, {
    requestId: body.requestId,
    meta: body.meta,
  });

  return NextResponse.json(response, { status: response.success ? 200 : 400 });
}
