import 'dotenv/config'
import { CronJob } from 'cron'
import { run } from './commands/auto'
import { run as checkIn } from './commands/check-in'
import { run as faucet } from './commands/faucet'
// import { run as mintNFT } from './commands/mint-nft'
import { run as rerollNFT } from './commands/reroll-nft'

process.env.CRON &&
  CronJob.from({
    cronTime: process.env.CRON as string,
    async onTick() {
      try {
        await run()
      } catch {}
    },
    start: true,
    timeZone: 'Asia/Shanghai',
  })

process.env.CHECK_CRON &&
  CronJob.from({
    cronTime: process.env.CHECK_CRON as string,
    async onTick() {
      try {
        await checkIn()
      } catch {}
    },
    start: true,
    timeZone: 'Asia/Shanghai',
  })

process.env.FAUCET_CRON &&
  CronJob.from({
    cronTime: process.env.FAUCET_CRON as string,
    async onTick() {
      try {
        await faucet()
      } catch {}
    },
    start: true,
    timeZone: 'Asia/Shanghai',
  })

// process.env.MINT_CORN &&
//   CronJob.from({
//     cronTime: process.env.MINT_CORN as string,
//     async onTick() {
//       try {
//         await mintNFT()
//       } catch {}
//     },
//     start: true,
//     timeZone: 'Asia/Shanghai',
//   })

process.env.REROLL_CORN &&
  CronJob.from({
    cronTime: process.env.REROLL_CORN as string,
    async onTick() {
      try {
        await rerollNFT()
      } catch {}
    },
    start: true,
    timeZone: 'Asia/Shanghai',
  })

// pm2 --name plume start pnpm -- run schedule
