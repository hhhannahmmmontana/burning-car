import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user.service';
import { User } from 'src/domain/entities/user.entity';

export interface JwtPayload {
    sub: string;
    username: string;
}

export interface TokenResponse {
    accessToken: string;
    user: {
        username: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.userService.findUser(username);
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            return user;
        }
        return null;
    }

    async login(user: User): Promise<TokenResponse> {
        const payload: JwtPayload = { 
            sub: user.username, 
            username: user.username 
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                username: user.username,
            },
        };
    }

    async register(username: string, password: string): Promise<TokenResponse> {
        const existingUser = await this.userService.findUser(username);
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const user = await this.userService.createUser(username, password);
        return this.login(user);
    }

    async validateToken(payload: JwtPayload): Promise<User> {
        const user = await this.userService.findUser(payload.username);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}