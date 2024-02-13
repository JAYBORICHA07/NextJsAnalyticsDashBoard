import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: 'https://busy-viper-40661.upstash.io',
  token: process.env.REDIS_KEY!,
})