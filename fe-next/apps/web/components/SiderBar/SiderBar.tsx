'use client';

import React from 'react';
import { FilesSideBar } from './FilesSideBar';

export function SiderBar() {
  // 未来可能需要多个侧边的切换逻辑，这里先保留选择器占位。
  const activeSidebar = 'files';

  return (
    <>
      {activeSidebar === 'files' && <FilesSideBar />}
      {/* 其它 sidebar 类型的占位可在此展开 */}
    </>
  );
}
