import 'dotenv/config'
import { CronJob } from 'cron'
import { run } from './commands/auto'
import { run as faucet } from './commands/faucet'

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

// pm2 --name plumn start pnpm -- run schedule
