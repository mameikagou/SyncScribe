# ADR-001：Repo Guide Spec 细化重写

- 日期：2026-02-11
- 状态：Accepted

## 背景
原 Spec 颗粒度偏粗，无法直接映射到每个实现文件与核心函数，违反新版 AGENTS 的 1:1 映射要求。

## 决策
- 重写 `specs/00-idea`、`specs/01-system`、`specs/02-specs`。
- `02-specs` 采用 `vibe-repo-guide/` 子目录，并维护索引表。
- 每个涉及文件都在对应 Spec 中有独立章节，核心函数含签名/依赖/伪代码。

## 影响
- Builder 阶段可按 Spec 直接施工。
- Auditor 阶段可逐文件追溯逻辑依据。
