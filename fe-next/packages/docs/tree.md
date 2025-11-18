`tree -I "node_modules|dist|.git" -d`


.
├── README.md
├── apps
│   ├── partykit
│   │   ├── package.json
│   │   ├── partykit.json
│   │   ├── server.ts
│   │   └── tsconfig.json
│   ├── python-service
│   │   ├── README.md
│   │   ├── `__pycache__`
│   │   │   └── main.cpython-313.pyc
│   │   ├── main.py
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   └── uv.lock
│   └── web
│       ├── app
│       │   ├── agent
│       │   │   └── page.tsx
│       │   ├── api
│       │   │   ├── chat
│       │   │   │   └── route.ts
│       │   │   ├── documents
│       │   │   │   └── [id]
│       │   │   │       └── route.ts
│       │   │   └── upload
│       │   │       └── route.ts
│       │   ├── favicon.ico
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components
│       │   ├── EditorHost.tsx
│       │   └── providers.tsx
│       ├── components.json
│       ├── eslint.config.js
│       ├── global.d.ts
│       ├── hooks
│       │   └── use-file-upload.ts
│       ├── lib
│       │   └── ai.ts
│       ├── next-env.d.ts
│       ├── next.config.mjs
│       ├── package.json
│       ├── pnpm-lock.yaml
│       ├── postcss.config.mjs
│       └── tsconfig.json
├── package.json
├── packages
│   ├── docs
│   │   ├── agent.md
│   │   ├── aisdk.md
│   │   ├── image-card.md
│   │   ├── input.md
│   │   ├── integrated-layout.md
│   │   ├── rich-text.md
│   │   ├── road.md
│   │   ├── system-design.md
│   │   └── tree.md
│   ├── eslint-config
│   │   ├── README.md
│   │   ├── base.js
│   │   ├── next.js
│   │   ├── package.json
│   │   └── react-internal.js
│   ├── partykit
│   ├── tools
│   │   ├── components.json
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   ├── postcss.config.mjs
│   │   ├── src
│   │   │   ├── Store
│   │   │   │   └── index.ts
│   │   │   ├── hooks
│   │   │   ├── index.ts
│   │   │   └── lib
│   │   │       └── utils.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.lint.json
│   ├── typescript-config
│   │   ├── README.md
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── package.json
│   │   └── react-library.json
│   └── ui
│       ├── components.json
│       ├── eslint.config.js
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── src
│       │   ├── components
│       │   │   ├── ChatInput.tsx
│       │   │   ├── Editor.tsx
│       │   │   ├── Toolbar.tsx
│       │   │   ├── button.tsx
│       │   │   ├── textarea.tsx
│       │   │   └── toggle.tsx
│       │   ├── index.ts
│       │   └── styles
│       │       └── globals.css
│       ├── tsconfig.json
│       └── tsconfig.lint.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json

30 directories, 79 files