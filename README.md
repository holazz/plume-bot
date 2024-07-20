## 准备工作

1. 安装依赖
  
```sh
pnpm install
```

2. 获取 `accessToken`

```sh
pnpm run auth
```

## 手动运行方式

### 交互

```sh
pnpm run dev
```

### 领水

```sh
pnpm run faucet
```

### 签到

```sh
pnpm run check
```

### Mint NFT

```sh
pnpm run mint
```

### Reroll NFT

```sh
pnpm run reroll
```

### 邀请

```sh
pnpm run invite
```

## 定时任务运行方式

1. 安装 `pm2`

```sh
pnpm install -g pm2
```

2. 启动定时任务

```sh 
pm2 --name plume start pnpm -- run schedule
```
