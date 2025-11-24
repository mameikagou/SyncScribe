import { atom } from 'jotai';

// === 1. UI State ===

// 全局输入框的内容 (CrystalBar)
export const chatInputAtom = atom('');

// AI 是否正在生成/思考中 (控制按钮转圈、输入框禁用)
export const isGeneratingAtom = atom(false);

// === 2. Data State ===

export interface Concept {
  title: string;
  description: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachmentUrls?: string[];
  concepts?: Concept[];
  createdAt?: number;
}

export interface Messages {
  messages: Message[];
}

// 消息列表 (用于右侧 Thinking Stream 展示)
export const messagesAtom = atom<Message[]>([]);

// 派生 Atom: 获取最新的一条消息 (可选，用于 UI 提示)
export const latestMessageAtom = atom((get) => {
  const messages = get(messagesAtom);
  return messages.length > 0 ? messages[messages.length - 1] : null;
});
