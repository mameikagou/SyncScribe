import { parse, Lang } from '@ast-grep/napi'
import { readFileSync } from 'fs'
import { join } from 'path'

// 相对于脚本定位 mock 文件
const filePath = join(import.meta.dir, 'mock.d.ts')
const code = readFileSync(filePath, 'utf-8')

// 使用 TypeScript 解析
const ast = parse(Lang.TypeScript, code)
const root = ast.root()

// 1. 提取组件名 (例如 export declare class Button ...)
const componentNode = root.find('export declare class $NAME extends $BASE { $$$ }')
const componentName = componentNode ? componentNode.getMatch('NAME')?.text() : null

// 2. 提取 Props 接口
// 我们严格假设如果组件是 "Button"，那么接口就是 "ButtonProps"，正如需求描述的那样
// 虽然我们可以更智能地动态查找映射到组件 props 逻辑的接口，
// 但依赖命名约定 "XProps" 对于这个 "势利眼" 脚本来说已经足够稳健了。
const interfaceName = componentName ? `${componentName}Props` : null
let interfaceNode = null

if (interfaceName) {
  // 模式匹配: export interface ButtonProps extends ... { ... }
  // 我们使用 $$$ 来匹配主体
  interfaceNode = root.find(`export interface ${interfaceName} extends $BASE { $$$ }`)
}

// 3. 提取 JSDocs 和 属性
const propsResults = []

if (interfaceNode) {
  // 查找接口中的所有属性
  // kind: property_signature 匹配 "name?: type;"
  const propNodes = interfaceNode.findAll({ rule: { kind: 'property_signature' } })

  for (const node of propNodes) {
    // 提取属性名
    const nameNode = node.find({ rule: { kind: 'property_identifier' } })
    const name = nameNode?.text()

    if (!name) continue

    // 提取类型
    // 类型注解通常包含冒号，或者是子节点。
    // 我们获取类型注解节点的原始文本，如果需要则去掉前导冒号/空格。
    const typeNode = node.find({ rule: { kind: 'type_annotation' } })
    let type = typeNode?.text() || 'any'
    // 类型注解文本通常是 ": string | undefined"
    if (type.startsWith(':')) {
      type = type.substring(1).trim()
    }

    // 提取 JSDoc
    // ast-grep 并不总是方便地链接 find() 匹配到的节点的前置注释。
    // 我们将使用范围 (ranges) 查看源代码。
    // 逻辑：查看紧邻节点之前的文本。
    const nodeStart = node.range().start.index
    const precedingText = code.substring(0, nodeStart).trimEnd()

    let jsDoc = null
    // 检查它是否以结束注释标记结尾
    if (precedingText.endsWith('*/')) {
      const commentStart = precedingText.lastIndexOf('/**')
      if (commentStart !== -1) {
        // 验证此注释属于该节点（即中间没有其他代码）
        // 我们已经做了 trimEnd()，所以实际上我们跳过了空白字符。
        // 中间不应该有大括号或分号。
        // 我们将严格信任相邻的 JSDocs。
        jsDoc = precedingText.substring(commentStart)
      }
    }

    propsResults.push({
      name,
      type,
      jsDoc
    })
  }
}

// 输出结果
const result = {
  component: componentName,
  propsInterface: interfaceName,
  props: propsResults
}

// console.log(result)

console.log(JSON.stringify(result, null, 2))
