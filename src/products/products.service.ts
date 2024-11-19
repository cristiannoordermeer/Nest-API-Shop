import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage } from './entities/product-images.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('Product Service');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource
  ) {}

  async create(createProductDto: CreateProductDto) {

    try {
      const {images = [], ...productDetails} = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({url: image}))
      });  /// regiter creation
      await this.productRepository.save(product);                       /// save it to DB

      return {...product, images};
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(pagination: PaginationDto) {
    const {limit=10, offset=0} = pagination;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });
    return products.map( (product: Product) => {
      return {
        ...product,
        images: product.images.map(img => img.url)
      }
    });
  }

  async  findOne(id: string) {
    const product = await this.productRepository.findOneBy({id});
    if (!product) {
      throw new NotFoundException(`product with id ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) { 
    const {images, ...toUpdate} = updateProductDto;
    const product = await this.productRepository.preload({
      id: id,
      ...toUpdate
    });

    if (!product) {
      throw new NotFoundException(`product with id ${id} not found`);
    }

    //create queryRunner
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {

      if (images) {                                                     //if images are coming, I  want to delete the current ones for the product and  insert the new ones
        await queryRunner.manager.delete(ProductImage, {product: {id}});

        product.images = images.map(img => this.productImageRepository.create({url: img}));
      } else {
        product.images = await this.productImageRepository.findBy({product: {id}});    // if images are not coming, I get the current ones
      }
      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return product;
  
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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
