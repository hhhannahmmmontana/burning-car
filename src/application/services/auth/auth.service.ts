import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "src/domain/entities/user.entity";
import * as bcrypt from 'bcrypt';
import { UserService } from "../user.service";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    public constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {}

    public static readonly MIN_USERNAME_LENGTH = 3;
    public static readonly MIN_PASSWORD_LENGTH = 8;

    async register(
        username: string,
        password: string
    ) {
        if (username.length < AuthService.MIN_USERNAME_LENGTH) {
            throw new BadRequestException("Too short username");
        }
        if (password.length < AuthService.MIN_PASSWORD_LENGTH) {
            throw new BadRequestException("Too short password");
        }
        const user = await this.userService.createUser(
            username,
            await bcrypt.hash(password, 14)
        );
        return this.generateToken(user);
    }

    async login(
        username: string,
        password: string
    ) {
        const user = await this.userService.findUser(username);
        
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return this.generateToken(user);
    }

    private generateToken(user: User) {
        const payload = { sub: user.username, username: user.username };
        
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                username: user.username,
            },
        };
    }
}