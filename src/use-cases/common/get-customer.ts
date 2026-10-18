import type { ICustomerRepository } from "@/domain/common/repositories/customer-repository";
import type { Customer } from "@/domain/common/entities/customer";
import { NotFoundError } from "@/lib/errors/not-found-error";

export class GetCustomer {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError("Customer", id);
    }
    return customer;
  }
}
