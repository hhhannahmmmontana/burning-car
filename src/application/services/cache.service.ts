import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

export class CacheSection {
    constructor(
        public readonly stringValue: string
    ) {}

    public withValue(value: Object): CacheKey {
        return new CacheKey(this.stringValue + ':' + value.toString());
    }
}

export class CacheKey {
    constructor(
        public readonly stringValue: string
    ) {}
}

export class CacheKeyBuilder {
    private result = "";

    constructor(
        baseSection: string
    ) {
        if (baseSection) {
            this.result = baseSection + ':';
        }
    }

    nextSection(): this {
        this.result += ':';
        return this;
    }

    addValue(value: Object): this {
        if (!this.result.endsWith(':')) {
            this.result += ',';
        }
        this.result += value.toString();
        return this;
    }

    addValues(values: Object[]) {
        if (this.result.endsWith(':')) {
            this.result += ',';
        }
        this.result += values.map(it => it.toString()).join(',');
        return this;
    }

    addSection(value: Object): this {
        return this.nextSection().addValue(value);
    }

    build(): CacheKey {
        return new CacheKey(this.result);
    }

    buildSection() {
        return new CacheSection(this.result);
    }
}

export interface CacheKeyInfo<T> {
    key: string
    ttl: string
    size: string
    data: T | null
}

export interface CacheInfo<T> {
    keys: CacheKeyInfo<T>[]
}

@Injectable()
export class CacheService<T> {
    public baseSection = "";

    public constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis
    ) {
        let host = `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
        console.log(`REDIS HOST: ${host}`);
    }

    createKeyBuilder(): CacheKeyBuilder {
        return new CacheKeyBuilder(this.baseSection);
    }

    async get(key: CacheKey): Promise<T | undefined> {
        let res = await this.redisClient.get(key.stringValue);
        if (!res) {
            return undefined;
        }
        return JSON.parse(res, this.dateReviver);
    }

    async set(key: CacheKey, value: T, ttl: number) {
        await this.redisClient.set(key.stringValue, JSON.stringify(value), 'EX', ttl);
    }

    async invalidateKey(key: CacheKey) {
        await this.redisClient.del(key.stringValue);
    }

    invalidateValue(section: CacheSection, value: Object) {
        return this.invalidateKey(section.withValue(value.toString()));
    }

    async getAllCacheInfo(): Promise<CacheInfo<T>> {
        const keys = await this.loadKeysFromRedis();
        const entries = await Promise.all(
            Array.from(keys).map(async (key) => {
                const value = await this.get(new CacheKey(key));
                const ttl = await this.redisClient.ttl(key);
                const serialized = JSON.stringify(value);

                return {
                    key,
                    ttl: this.formatTtl(ttl ?? 0),
                    size: this.formatSize(serialized.length),
                    data: value ?? null,
                };
            })
        );

        return {
            keys: entries
        };
    }

    private async loadKeysFromRedis(): Promise<string[]> {
        let cursor = '0';
        let keys: string[] = [];
        do {
            const [nextCursor, foundKeys] = await this.redisClient.scan(
                cursor,
                'MATCH', '*',
                'COUNT', 100
            );
            cursor = nextCursor;

            foundKeys.forEach(key => keys.push(key));
        } while (cursor !== '0');
        return keys;
    }

    private formatTtl(seconds: number): string {
        if (seconds === -1) return 'no expiry';
        if (seconds === -2) return 'expired';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    private dateReviver(key: string, value: any): any {
        if (typeof value === 'string') {
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
            if (isoDateRegex.test(value)) {
                return new Date(value);
            }
        }
        return value;
    }
}