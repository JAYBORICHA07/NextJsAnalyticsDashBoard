import { getDate } from "@/utils"
import { redis } from "@/lib/redis"
import { parse } from "date-fns"

type TrackOptions = {
    persist?: boolean
}

type AnalyticsArgs = {
    retention?: number
}

export class Analytics {
    private retention: number = 60 * 60 * 24 * 7

    constructor(opts?: AnalyticsArgs) {
        if (opts?.retention) this.retention = opts.retention
    }

    async track(namespace: string, event: object = {}, opts?: TrackOptions) {

        let key = `analytics::${namespace}`

        if (!opts?.persist) {
            key += `::${getDate()}`
        }

        //db call to persist this event
        console.log(key)
        console.log(JSON.stringify(event));
        await redis.hincrby(key, JSON.stringify(event), 1)
        if (!opts?.persist) await redis.expire(key, this.retention)

    }


    async retrieve(namespace: string, date: string) {
        const res = await redis.hgetall<Record<string, string>>(`analytics::${namespace}::${date}`)
        return {
            date,
            events: Object.entries(res ?? []).map(([key, value]) => ({
                [key]: Number(value)
            }))
        }
    }

    async retrieveDays(namespace: string, nDays: number) {
        type AnalyticsPromise = ReturnType<typeof analytics.retrieve>
        const promises: AnalyticsPromise[] = []

        for (let i = 0; i < nDays; i++) {
            const formattedDate = getDate(i)
            const promise = analytics.retrieve(namespace, formattedDate)
            promises.push(promise)

        }

        const fetched = await Promise.all(promises)

        const data = fetched.sort((a, b) => {
            if (parse(a.date, "dd/MM/yyyy", new Date()) > parse(b.date, "dd/MM/yyyy", new Date())) {
                return 1;
            } else {
                return -1;
            }
        })
        console.log(data)
        return data
    }

}

export const analytics = new Analytics()