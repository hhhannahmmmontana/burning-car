import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import * as CacheManager from "cache-manager";
import { RedisStore } from 'cache-manager-ioredis-yet';
import { RedisClient } from "ioredis/built/connectors/SentinelConnector/types";

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

@Injectable()
export class CacheService<T> {
    public baseSection = "";

    public constructor(
        @Inject(CACHE_MANAGER) private cacheManager: CacheManager.Cache
    ) {}

    createKeyBuilder(): CacheKeyBuilder {
        return new CacheKeyBuilder(this.baseSection);
    }

    async get(key: CacheKey): Promise<T | undefined> {
        return await this.cacheManager.get<T>(key.stringValue);
    }

    async set(key: CacheKey, value: T, ttl: number) {
        await this.cacheManager.set(key.stringValue, value, ttl);
    }

    async invalidateKey(key: CacheKey) {
        await this.cacheManager.del(key.stringValue);
    }

    async invalidateValue(section: CacheSection, value: Object) {
        this.invalidateKey(section.withValue(value.toString()));
    }
}