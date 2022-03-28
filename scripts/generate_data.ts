import Chance from 'chance';
import fs from 'fs';

interface Product {
  name: string;
  price: number;
}

interface CartItem {
  cartId: number;
  productId: number;
}

function generateCartItems(cartId: number, itemsQuantity: number, totalQuantityOfProducts: number) {
  const cartItems: CartItem[] = [];

  for (let i = 0; i < itemsQuantity; i++) {
    cartItems.push({ cartId, productId: chance.integer({ min: 1, max: totalQuantityOfProducts }) })
  }

  return cartItems;
}

const chance = new Chance();

const products: Product[] = [];
const cartItems: CartItem[] = [];

for (let i = 0; i < 200; i++) {
  products.push({ name: chance.string({ length: 5, pool: 'ABCDEFGHIKLMNOPQRSTUVWXYZ' }), price: chance.integer({ min: 100, max: 200 }) });
}

for (let i = 1; i <= products.length; i++) {
  let ci = generateCartItems(i, i, products.length);
  cartItems.push(...ci);
}

fs.writeFileSync(`${__dirname}/../data/seed/products.json`, JSON.stringify(products, null, 2));
fs.writeFileSync(`${__dirname}/../data/seed/cartItems.json`, JSON.stringify(cartItems, null, 2));