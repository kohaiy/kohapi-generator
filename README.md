# @kohapi/generator

> 开发中

一个自动生成代码文件的工具

## 使用说明

```bash
# 全局安装
npm install -g @kohapi/generator

# 局部安装（推荐）
npm install -D @kohapi/generator

# 查看帮助信息
kohapi-generator

# 初始化配置文件
kohapi-generator init

# 生成 yapi 对应的前端文件
kohapi-generator yapi-client-ts

# 生成 yapi 对应的 hapi 文件
kohapi-generator yapi-hapi-ts

# 指定配置文件名称，路径相对于项目根目录
kohapi-generator yapi-client-ts -c ./config/kohapi.config.js

# 其他待开发
```