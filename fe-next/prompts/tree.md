`tree -I "node_modules|dist|.git" -d`

├── app
│   ├── agent
│   │   └── page.tsx
│   ├── api
│   │   ├── [[...route]]
│   │   │   └── route.ts
│   │   ├── chat
│   │   │   └── route.ts
│   │   ├── documents
│   │   │   └── [id]
│   │   │       └── route.ts
│   │   └── upload
│   │       └── route.ts
│   ├── favicon.ico
│   ├── layout.tsx
│   ├── page.tsx
│   └── test
│       ├── hono.tsx
│       └── page.tsx
├── components
│   ├── AttachmentList.tsx
│   ├── ChatCards.tsx
│   ├── ChatContainer.tsx
│   ├── CrystalBar.tsx
│   ├── EditorHost.tsx
│   ├── SiderBar
│   │   ├── ChatSiderBar.tsx
│   │   ├── FilesSideBar.tsx
│   │   └── SiderBar.tsx
│   ├── providers.tsx
│   └── test
│       └── test-ingest.tsx
├── components.json
├── dev-log
│   └── 2025.11.27.md
├── eslint.config.js
├── global.d.ts
├── hooks
│   ├── use-chat-submit.ts
│   ├── use-file-upload.ts
│   └── use-media-upload.ts
├── lib
│   ├── ai.ts
│   ├── client.ts
│   ├── db
│   │   └── prisma.ts
│   └── types.ts
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── prisma
│   ├── index.md
│   ├── migrations
│   │   ├── 20251124115538_init_db
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── sql
│       ├── insertEmbedding.sql
│       └── queryEmbeddings.sql
├── prisma.config.ts
├── scripts
│   ├── index.md
│   ├── ingest-pdf.ts
│   └── test-retrieve.ts
├── server
│   ├── app.ts
│   ├── routers
│   │   ├── mcp.ts
│   │   └── test.ts
│   └── services
│       ├── mcp
│       │   ├── action.ts
│       │   └── index.ts
│       ├── parser
│       │   ├── llama-parse.ts
│       │   ├── parsePdfFromLayout.ts
│       │   └── parser.ts
│       ├── rag
│       │   ├── chunking.ts
│       │   ├── embedding.ts
│       │   ├── ingest.ts
│       │   ├── rag.ts
│       │   └── retrieve.ts
│       └── types.ts
├── store
│   └── chat-atoms.ts
├── tsconfig.json
└── view
    └── ChatView.tsx


fe-next/apps/web：
"dependencies": {
"@ai-sdk/openai": "^2.0.64",
"@ai-sdk/react": "^2.0.95",
"@neondatabase/serverless": "^1.0.2",
"@prisma/adapter-neon": "^7.0.0",
"@prisma/client": "^7.0.0",
"@prisma/extension-accelerate": "^3.0.0",
"@vercel/blob": "^2.0.0",
"@vercel/postgres": "^0.10.0",
"@workspace/tools": "workspace:*",
"@workspace/ui": "workspace:*",
"ai": "^5.0.90",
"dotenv": "^17.2.3",
"lucide-react": "^0.475.0",
"next": "^16.0.1",
"next-themes": "^0.4.6",
"react": "^19.1.1",
"react-dom": "^19.1.1",
"sonner": "^2.0.7",
"uuid": "^13.0.0",
"ws": "^8.18.3",
"y-partykit": "^0.0.33"
},