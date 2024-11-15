import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('Product Service');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async create(createProductDto: CreateProductDto) {

    try {
      const product = this.productRepository.create(createProductDto);  /// regiter creation
      await this.productRepository.save(product);                       /// save it to DB

      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
    return
  }

  async findAll(pagination: PaginationDto) {
    const {limit=10, offset=0} = pagination;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset
    });
    return products;
  }

  async  findOne(id: string) {
    const product = await this.productRepository.findOneBy({id});
    if (!product) {
      throw new NotFoundException(`product with id ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) { 
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if (!product) {
      throw new NotFoundException(`product with id ${id} not found`);
    }

    try {
      await this.productRepository.save(product);
      return product;
  
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    
    this.productRepository.remove(product);
    return `Product with id:${id} removed`;
  }

  private handleExceptions(error: any) {
    if (error.code = '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, please check the logs');
  }
}
