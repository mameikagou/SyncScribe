'use client';

import React, { useState } from 'react';
import { UploadCloud, FolderOpen, Bookmark } from 'lucide-react';
import { FilesSideBar } from './FilesSideBar';

export function SiderBar() {
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload');

  return (
    <div className="w-full h-full flex bg-[#F7F7F5] relative overflow-hidden font-sans text-stone-800 ">
      <div className="w-[56px] h-full flex flex-col items-center py-6 gap-6 border-r border-stone-200/50 bg-stone-100/30">
        <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white mb-2 shadow-sm">
          <div className="font-serif font-bold italic leading-none">M</div>
        </div>

        <div className="flex flex-col gap-4 w-full px-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              activeTab === 'upload'
                ? 'bg-white shadow-sm text-stone-900'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
            }`}
            title="Upload"
          >
            <UploadCloud size={20} strokeWidth={activeTab === 'upload' ? 2 : 1.5} />
            {activeTab === 'upload' && (
              <div className="absolute -left-1 w-1 h-3 bg-stone-800 rounded-r-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              activeTab === 'files'
                ? 'bg-white shadow-sm text-stone-900'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
            }`}
            title="Files"
          >
            <FolderOpen size={20} strokeWidth={activeTab === 'files' ? 2 : 1.5} />
            {activeTab === 'files' && (
              <div className="absolute -left-1 w-1 h-3 bg-stone-800 rounded-r-full" />
            )}
          </button>

          <button
            className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 transition-all"
            title="Bookmarks"
          >
            <Bookmark size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* <div className="mt-auto flex flex-col gap-4">
          <button className="text-stone-400 hover:text-stone-600 transition-colors">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div> */}
      </div>

      <div className="flex-1 h-full flex flex-col">
        <div className="pt-7 pb-2 pl-2">
          <h6 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 mb-4 uppercase">
            Library
          </h6>
          <h1 key={activeTab} className="font-serif text-3xl text-[#1a1918] mb-2">
            {activeTab === 'upload' ? 'Upload Repository' : 'Files'}
          </h1>
          <p className="text-xs text-stone-400 font-sans">
            {activeTab === 'upload'
              ? 'Import raw materials to the knowledge base.'
              : 'Access your curated documents.'}
          </p>
        </div>

        <FilesSideBar />
      </div>
    </div>
  );
}
