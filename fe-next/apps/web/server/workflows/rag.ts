'use server';

import { createWorkflow, workflowEvent } from '@llamaindex/workflow-core'; // LlamaIndex Workflows: createWorkflow 生成工作流容器，workflowEvent 定义事件类型
import type { queryEmbeddings } from '@prisma/client/sql';
import { retrieveEmbeddings } from '@/server/services/rag/retrieve'; // 复用已有的向量检索逻辑，工作流只是 orchestration，不改业务

/**
 * 工作流输入载荷：查询语句 + 可选 limit（限制返回条数）
 */
type RetrievePayload = {
  query: string;
  limit?: number;
};

/**
 * recall 工作流的精简返回结构（只挑关键字段）
 */
type RecallResult = {
  embeddingId: string;
  similarity: number | null;
  contentPreview: string;
  fileName: string | null;
  resourceId: string | null;
};

// 定义事件：请求事件（输入 query+limit）、完整结果事件、精简结果事件
const retrieveRequestEvent = workflowEvent<RetrievePayload>({ debugLabel: 'retrieve:request' });
const retrieveResultEvent = workflowEvent<queryEmbeddings.Result[]>({ debugLabel: 'retrieve:result' });
const recallResultEvent = workflowEvent<RecallResult[]>({ debugLabel: 'recall:result' });

// 创建两个独立的工作流实例，分别处理 /retrieve 和 /recall
const retrieveWorkflow = createWorkflow();
const recallWorkflow = createWorkflow();

// 工作流 handler：收到 retrieveRequestEvent 时，调用向量检索并发出 retrieveResultEvent
retrieveWorkflow.handle([retrieveRequestEvent], async (_context, event) => {
  const { query, limit } = event.data;
  const results = await retrieveEmbeddings(query, limit);
  return retrieveResultEvent.with(results);
});

// 工作流 handler：同样消费 retrieveRequestEvent，但输出精简字段的 recallResultEvent
recallWorkflow.handle([retrieveRequestEvent], async (_context, event) => {
  const { query, limit } = event.data;
  const results = await retrieveEmbeddings(query, limit);

  const simplified = results.map<RecallResult>((row) => ({
    embeddingId: row.embeddingId,
    similarity: row.similarity,
    contentPreview: row.content?.slice(0, 200) ?? '',
    fileName: row.fileName,
    resourceId: row.resourceId,
  }));

  return recallResultEvent.with(simplified);
});

/**
 * 运行检索工作流：
 * 1) workflow.createContext() 创建上下文（包含事件流、sendEvent 等）。
 * 2) context.stream.untilEvent(...) 订阅并等待目标事件。
 * 3) context.sendEvent(...) 发送起始事件，驱动 handler 执行。
 * 4) 取回事件数据并返回给路由。
 */
export async function runRetrieveWorkflow(payload: RetrievePayload) {
  const context = retrieveWorkflow.createContext();
  const done = context.stream.untilEvent(retrieveResultEvent);
  context.sendEvent(retrieveRequestEvent.with(payload));
  const event = await done;
  return event.data;
}

/**
 * 运行精简召回工作流：流程同上，只是等待 recallResultEvent。
 */
export async function runRecallWorkflow(payload: RetrievePayload) {
  const context = recallWorkflow.createContext();
  const done = context.stream.untilEvent(recallResultEvent);
  context.sendEvent(retrieveRequestEvent.with(payload));
  const event = await done;
  return event.data;
}
