import type { ICustomerRepository } from "@/domain/common/repositories/customer-repository";
import type { Customer } from "@/domain/common/entities/customer";

export class GetCustomers {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(): Promise<Customer[]> {
    return this.customerRepository.findAll();
  }
}
