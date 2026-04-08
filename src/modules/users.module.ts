import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "src/application/services/user.service";
import { User } from "src/domain/entities/user.entity";
import { UsersController } from "src/presentation/controllers/users.controller";


@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UserService],
    exports: [UserService],
    controllers: [UsersController],
})
export class UsersModule {}