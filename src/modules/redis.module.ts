// redis.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => ({
                store: await redisStore({
                    redisInstance: redisClient,
                }),
                ttl: 300000,
            }),
        }),
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useValue: redisClient,
        },
    ],
    exports: [CacheModule, 'REDIS_CLIENT'],
})
export class RedisModule {}