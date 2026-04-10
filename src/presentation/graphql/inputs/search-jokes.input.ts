import { Field, InputType, Int } from "@nestjs/graphql";
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

@InputType()
export class SearchJokesInput {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    pageSize: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    token?: string;

    @Field(() => [String], { nullable: true, defaultValue: [] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    search?: string;

    @Field(() => Boolean, { nullable: true, defaultValue: true })
    @IsOptional()
    @IsBoolean()
    sortByPopularity?: boolean;

    @Field(() => Boolean, { nullable: true, defaultValue: false })
    @IsOptional()
    @IsBoolean()
    isFavourites?: boolean;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    username?: string;
}