import 'dotenv/config'
import { CronJob } from 'cron'
import { run } from './commands/auto'
import { run as checkIn } from './commands/check-in'
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
  cronTime: process.env.CHECK_CRON as string,
  async onTick() {
    try {
      await checkIn()
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

// pm2 --name plume start pnpm -- run schedule
