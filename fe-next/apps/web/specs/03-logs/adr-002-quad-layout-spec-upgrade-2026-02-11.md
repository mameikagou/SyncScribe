# ADR-002：Spec 升级到 Quad Layout + Magic Link

- 日期：2026-02-11
- 状态：Accepted

## 背景
`AGENTS.md` 与 `I-001-repo-guide-idea.md` 更新后，产品核心从“问答页”升级为“交互式四列代码导游工作台”。

## 决策
1. 在 `01-system` 中加入四列布局、MVVM、请求分层、Magic Link 契约。
2. 在 `02-specs` 中新增前端布局与协议文档（RG-020~RG-026）。
3. 补全 `dependence.md`，锁定前后端库并明确“不引入 dnd-kit、手写 hooks”。

## 影响
- Builder 阶段将以“布局+联动”作为主线，而不是单纯问答面板。
- 后端将新增 guide manifest/doc 相关服务与接口。

