import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const idProducts = products.map(({ id }) => ({ id }));

    const allProducts = await this.productsRepository.findAllById(idProducts);

    if (products.length !== allProducts.length) {
      throw new AppError('Products not found.');
    }

    allProducts.forEach(product => {
      const productOrder = products.find(({ id }) => product.id === id);

      if (productOrder) {
        if (productOrder.quantity > product.quantity) {
          throw new AppError('Product with insuficient quantity');
        }
      }
    });

    const arrayProducts = allProducts.map(({ id, price }) => ({
      product_id: id,
      price,
      quantity: products.find(prod => prod.id === id)?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: arrayProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
