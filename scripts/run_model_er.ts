import products from '../data/products.json';
import cartItems from '../data/cartItems.json';
import fs from 'fs/promises';
import type { ModelERInstance } from '../types/truffle-contracts';

const modelERContract = artifacts.require('ModelER');

type ModelERFunc = { [P in keyof ModelERInstance['methods']]: ModelERInstance[P] extends (...args: any[]) => any ? ModelERInstance[P] : never }

interface Transaction {
  name: keyof ModelERFunc;
  tx: Truffle.TransactionResponse<any>
}

module.exports = function (callback) {
  main()
    .catch(console.error)
    .finally(() => {
      console.log('finished');
      callback();
    })
}
async function main() {
  const modelER = await modelERContract.deployed();

  const transactions: Array<Transaction> = [];

  let tx = await populateProducts(modelER);
  transactions.push(...tx);

  tx = await populateCartItems(modelER);
  transactions.push(...tx);

  const uniqueCartIds = cartItems
    .reduce((set, cartItem) => set.add(cartItem.cartId), new Set<number>())

  for (const cartId of uniqueCartIds) {
    const tx = await showCartTotalPrice(modelER, cartId);
    transactions.push(tx);
  }

  const dirPath = `${__dirname}/../transactions`;

  try {
    await fs.mkdir(dirPath);
  } catch (err) {
    console.error(err);
  }

  await fs.writeFile(
    `${dirPath}/tx.txt`,
    JSON.stringify(transactions, null, 2),
    { flag: 'w' }
  );
}

async function populateProducts(modelER: ModelERInstance) {
  const transactions: Array<Transaction> = [];

  for (let product of products) {
    const transaction = await sendTransaction(modelER, 'addProduct', product.name, product.price);
    transactions.push({ name: 'addProduct', tx: transaction });
  }

  return transactions;
}

async function populateCartItems(modelER: ModelERInstance) {
  const transactions: Array<Transaction> = [];

  for (const cartItem of cartItems) {
    const transaction = await sendTransaction(modelER, 'addItemToCart', cartItem.cartId, cartItem.productId);
    transactions.push({ name: 'addItemToCart', tx: transaction });
  }

  return transactions;
}

async function showCartTotalPrice(modelER: ModelERInstance, cartId: number) {
  const transaction = await sendTransaction(modelER, 'showTotal', cartId);
  return { name: 'showTotal', tx: transaction } as Transaction;
}

async function sendTransaction<T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>): Promise<Truffle.TransactionResponse<any>> {
  // @ts-ignore (some functions does not have the sendTransaction function in their type annotation)
  return modelER[func].sendTransaction(...args)
}
