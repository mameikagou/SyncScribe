// 告诉 TypeScript，所有以 .css 结尾的文件
// 都是一个有效的模块。
// 这对于副作用导入 (side-effect imports) 来说已经足够了。
declare module "*.css";