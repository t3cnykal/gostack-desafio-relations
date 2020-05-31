import { Request, Response } from 'express';

import { container } from 'tsyringe';
import CreateProductService from '@modules/products/services/CreateProductService';

export default class ProductsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { name, quantity, price } = request.body;

    const service = container.resolve(CreateProductService);

    const products = await service.execute({ name, quantity, price });

    return response.json(products);
  }
}
