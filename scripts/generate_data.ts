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
  products.push({ name: chance.string({ length: 5 }), price: chance.integer({ min: 100, max: 1000 * 100 }) });
}

// cart with 1 items
let ci = generateCartItems(1, 1, products.length);
cartItems.push(...ci);

// cart with 3 items
ci = generateCartItems(1, 3, products.length);
cartItems.push(...ci);

// cart with 5 items
ci = generateCartItems(2, 5, products.length);
cartItems.push(...ci);

// cart with 10 items
ci = generateCartItems(3, 10, products.length);
cartItems.push(...ci);

// cart with 20 items
ci = generateCartItems(4, 20, products.length);
cartItems.push(...ci);

// cart with 200 items
ci = generateCartItems(5, 200, products.length);
cartItems.push(...ci);

fs.writeFileSync(`${__dirname}/../data/products.json`, JSON.stringify(products, null, 2));
fs.writeFileSync(`${__dirname}/../data/cartItems.json`, JSON.stringify(cartItems, null, 2));