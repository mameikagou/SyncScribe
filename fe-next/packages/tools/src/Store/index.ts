// 1. 创建一个 atom 来持有 Tiptap editor 实例

import { atom } from 'jotai';
import type { TiptapEditor } from '@workspace/ui/index';

// 我们导出它，以便 Toolbar 和 Editor 都能使用
export const editorAtom = atom<TiptapEditor | null>(null);


