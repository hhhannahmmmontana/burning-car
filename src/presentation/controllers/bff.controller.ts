import { Controller, Get } from '@nestjs/common';
import { CacheService } from 'src/application/services/cache.service';
import { UserJoke } from 'src/domain/entities/user-joke.entity';
import { PaginatedResponse } from 'src/domain/paginated-response';

@Controller('bff')
export class BffController {
    constructor(
        private readonly cacheService: CacheService<PaginatedResponse<UserJoke>>
    ) {}

    @Get()
    async getCacheState() {
        return await this.cacheService.getAllCacheInfo();
    }
}