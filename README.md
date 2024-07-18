## 准备工作

1. 安装依赖
  
```sh
  pnpm install
```

2. 获取 `accessToken`

```sh
pnpm run auth
```

## 常用指令

### 交互

```sh
pnpm run dev
```

### 邀请

```sh
pnpm run invite
```

### Mint NFT

```sh
pnpm run mint
```

### 重新随机 NFT

```sh
pnpm run reroll
```

## 定时任务

```sh 
pm2 --name plume start pnpm -- run schedule
```
