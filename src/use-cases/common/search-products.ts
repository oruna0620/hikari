import type { IProductRepository } from "@/domain/common/repositories/product-repository";
import type { Product } from "@/domain/common/entities/product";

export class SearchProducts {
  constructor(private productRepository: IProductRepository) {}

  async execute(query?: string): Promise<Product[]> {
    if (query && query.trim().length > 0) {
      return this.productRepository.search(query.trim());
    }
    return this.productRepository.findAll();
  }
}
