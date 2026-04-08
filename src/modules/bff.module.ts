import { Module } from '@nestjs/common';
import { JokesModule } from './jokes.module';
import { BffController } from 'src/presentation/controllers/bff.controller';
import { BffService } from 'src/application/bff/bff.service';

@Module({
    imports: [JokesModule],
    controllers: [BffController],
    providers: [BffService],
    exports: [BffService],
})
export class BffModule {}