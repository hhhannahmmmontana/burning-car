import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsString, IsBoolean, IsArray, Min } from 'class-validator';

@InputType()
export class SearchJokesInput {
    @Field(() => Int, { defaultValue: 10 })
    @IsInt()
    @Min(1)
    pageSize: number = 10;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    token?: string;

    @Field(() => [String], { nullable: true, defaultValue: [] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    search?: string;

    @Field({ defaultValue: false })
    @IsBoolean()
    isFavourites: boolean = false;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    username?: string;
}