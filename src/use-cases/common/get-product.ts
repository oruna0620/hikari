import type { IProductRepository } from "@/domain/common/repositories/product-repository";
import type { Product } from "@/domain/common/entities/product";
import { NotFoundError } from "@/lib/errors/not-found-error";

export class GetProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product", id);
    }
    return product;
  }
}
