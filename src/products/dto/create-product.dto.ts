import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateProductDto {

    @IsString()
    @MinLength(1)
    title: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    price?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    stock?: number;

    @IsString({each: true})
    @IsArray()
    sizes: string[];

    @IsIn(['men', 'women', 'kids', 'unisex'])
    gender: string;
    
    @IsOptional()
    @IsString({each: true})
    @IsArray()
    images?: string[];
}
