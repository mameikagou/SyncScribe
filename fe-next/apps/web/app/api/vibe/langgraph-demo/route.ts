/**
 * ============================================================================
 * LangGraph Functional API 学习示例
 * ============================================================================
 * 
 * 本文件演示了 LangGraph.js 的 Functional API 基本用法。
 * Functional API 是 LangGraph 提供的一种更简洁、更接近原生 JavaScript/TypeScript
 * 编程风格的工作流定义方式。
 * 
 * 核心概念：
 * 1. entrypoint - 工作流的入口点，负责管理整个工作流的执行
 * 2. task - 定义一个可异步执行的任务单元，支持检查点保存
 * 3. MemorySaver - 内存检查点保存器，用于在开发时保存和恢复工作流状态
 * 
 * API 端点: POST /api/vibe/langgraph-demo
 * 请求示例:
 * {
 *   "topic": "人工智能在医疗领域的应用"
 * }
 * 
 * 响应示例:
 * {
 *   "success": true,
 *   "threadId": "uuid-xxx",
 *   "data": { ... }
 * }
 * 
 * 测试命令:
 * curl -X POST http://localhost:3000/api/vibe/langgraph-demo \
 *   -H "Content-Type: application/json" \
 *   -d '{"topic":"人工智能"}'
 */

import { NextRequest, NextResponse } from 'next/server';
// 引入 LangGraph 的核心 Functional API
import { 
  MemorySaver,  // 内存检查点保存器，用于保存工作流状态
  entrypoint,   // 工作流入口点装饰器
  task          // 任务定义装饰器
} from '@langchain/langgraph';

// 引入 uuid 用于生成唯一的线程 ID
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// 任务定义 (Tasks)
// ============================================================================
// task() 函数用于定义一个**可追踪的异步任务**
// 
// 语法: task(taskName: string, taskFunction: (input) => Promise<output>)
// 
// 特点:
// - 每个 task 执行的结果会被保存到检查点 (checkpoint)
// - 如果工作流被中断后恢复，已完成的 task 不会重新执行
// - task 的输入和输出必须是 JSON 可序列化的
// ============================================================================

/**
 * 任务 1: 生成文章大纲
 * 
 * 这是一个模拟的任务，接收一个主题，返回一个大纲列表
 * 在实际应用中，这里可以调用 LLM 来生成大纲
 */
const generateOutline = task(
  'generateOutline',  // 任务名称，用于在检查点中标识
  async (topic: string): Promise<string[]> => {
    // 模拟 LLM 调用的延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 返回模拟的大纲
    return [
      `1. ${topic}的背景和发展历程`,
      `2. ${topic}的核心技术原理`,
      `3. ${topic}的实际应用场景`,
      `4. ${topic}的未来发展趋势`,
      `5. 结论与展望`
    ];
  }
);

/**
 * 任务 2: 根据大纲生成文章内容
 * 
 * 这个任务接收大纲数组，生成完整的文章
 */
const writeContent = task(
  'writeContent',
  async (outline: string[]): Promise<string> => {
    // 模拟更长的 LLM 调用延迟
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // 将大纲拼接成文章
    const content = outline.map((section, index) => {
      return `## ${section}\n\n这里是关于"${section}"的详细内容...（示例文本）\n`;
    }).join('\n');
    
    return content;
  }
);

/**
 * 任务 3: 生成摘要
 * 
 * 这个任务接收文章内容，生成一个简短的摘要
 */
const generateSummary = task(
  'generateSummary',
  async (content: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // 返回模拟的摘要
    const wordCount = content.length;
    return `本文共 ${wordCount} 字，涵盖了主题的背景、技术原理、应用场景和未来趋势。`;
  }
);

// ============================================================================
// 工作流定义 (Workflow) 使用 entrypoint
// ============================================================================
// entrypoint() 是 Functional API 的核心，它定义了一个完整的工作流入口
// 
// 语法: entrypoint({ checkpointer, name }, async (input) => { ... })
// 
// 参数说明:
// - checkpointer: 检查点保存器实例，用于持久化工作流状态
// - name: 工作流名称，用于标识和调试
// 
// 重要特性:
// 1. 自动管理异步任务的执行顺序
// 2. 支持工作流中断和恢复 (Human-in-the-loop)
// 3. 支持状态持久化 (通过 checkpointer)
// ============================================================================

// 创建一个内存检查点保存器
// 注意: MemorySaver 只适用于开发环境，生产环境应该使用持久化存储
const checkpointer = new MemorySaver();

/**
 * 文章生成工作流
 * 
 * 这个工作流接收一个主题，然后依次执行:
 * 1. 生成大纲
 * 2. 根据大纲写内容
 * 3. 生成摘要
 * 
 * 最终返回完整的结果对象
 */
const articleWorkflow = entrypoint(
  {
    checkpointer,        // 传入检查点保存器
    name: 'articleWorkflow'  // 工作流名称
  },
  async (topic: string) => {
    // ========================================================================
    // 步骤 1: 生成大纲
    // ========================================================================
    // 直接 await task 函数调用即可
    // task 内部会自动处理检查点保存
    console.log(`[Step 1] 正在为主题 "${topic}" 生成大纲...`);
    const outline = await generateOutline(topic);
    console.log(`[Step 1] 大纲生成完成:`, outline);
    
    // ========================================================================
    // 步骤 2: 根据大纲写内容
    // ========================================================================
    console.log(`[Step 2] 正在根据大纲生成内容...`);
    const content = await writeContent(outline);
    console.log(`[Step 2] 内容生成完成，共 ${content.length} 字`);
    
    // ========================================================================
    // 步骤 3: 生成摘要
    // ========================================================================
    console.log(`[Step 3] 正在生成摘要...`);
    const summary = await generateSummary(content);
    console.log(`[Step 3] 摘要生成完成:`, summary);
    
    // ========================================================================
    // 返回最终结果
    // ========================================================================
    return {
      topic,
      outline,
      content,
      summary,
      generatedAt: new Date().toISOString()
    };
  }
);

// ============================================================================
// API 路由处理器
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { topic } = body;
    
    // 验证参数
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的 topic 参数' },
        { status: 400 }
      );
    }
    
    // ========================================================================
    // 执行工作流
    // ========================================================================
    // 生成一个唯一的线程 ID
    // thread_id 用于标识一次工作流执行，可以用来恢复中断的工作流
    const threadId = uuidv4();
    
    // 配置对象，包含线程 ID
    const config = {
      configurable: {
        thread_id: threadId
      }
    };
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`开始执行工作流, Thread ID: ${threadId}`);
    console.log(`主题: ${topic}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // ========================================================================
    // 方式 1: 使用 invoke() 一次性执行并获取最终结果
    // ========================================================================
    // invoke() 会等待整个工作流执行完成，返回最终结果
    const result = await articleWorkflow.invoke(topic, config);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`工作流执行完成!`);
    console.log(`${'='.repeat(60)}\n`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      threadId,
      data: result
    });
    
  } catch (error) {
    console.error('工作流执行失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET 请求 - 返回 API 说明
// ============================================================================
export async function GET() {
  return NextResponse.json({
    name: 'LangGraph Functional API Demo',
    description: '这是一个演示 LangGraph Functional API 基本用法的示例接口',
    endpoints: {
      'POST /api/vibe/langgraph-demo': {
        description: '生成一篇关于指定主题的文章',
        body: {
          topic: 'string - 文章主题（必填）'
        },
        example: {
          topic: '人工智能在医疗领域的应用'
        }
      }
    },
    concepts: {
      entrypoint: '工作流入口点，定义整个工作流的执行逻辑',
      task: '定义一个可追踪的异步任务，支持检查点保存',
      checkpointer: '检查点保存器，用于持久化工作流状态',
      'thread_id': '线程 ID，用于标识和恢复特定的工作流执行'
    }
  });
}
