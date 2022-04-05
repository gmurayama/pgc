import products from '../data/seed/products.json';
import cartItems from '../data/seed/cartItems.json';
import fs from 'fs/promises';
import type { ModelERInstance } from '../types/truffle-contracts';
import TaskManager from './helper/taskManager';
import { log } from './helper/log';

const taskManager = new TaskManager<Truffle.TransactionResponse<any>>({
  create: <T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>) => {
    // @ts-ignore (some functions does not have the sendTransaction function in their type annotation)
    return () => modelER[func].sendTransaction(...args);
  },
  maxResourceAvailable: 1000
})
const modelERContract = artifacts.require('ModelER');

type ModelERFunc = { [P in keyof ModelERInstance['methods']]: ModelERInstance[P] extends (...args: any[]) => any ? ModelERInstance[P] : never }

interface Transaction {
  name: keyof ModelERFunc;
  args: NonNullable<object>;
  tx: Truffle.TransactionResponse<any>
}

module.exports = function (callback) {
  console.time('run-model-er');
  main()
    .catch(console.error)
    .finally(() => {
      console.timeEnd('run-model-er');
      callback();
    })
}
async function main() {
  const modelER = await modelERContract.deployed();

  const transactions: Array<Transaction> = [];

  log(`Start populating products`);
  let tx = await populateProducts(modelER);
  transactions.push(...tx);
  log(`End populating products`);

  log(`Start populating cart items`);
  tx = await populateCartItems(modelER);
  transactions.push(...tx);
  log(`End populating cart items`);

  log(`Start deduplicating cart IDs`);
  const uniqueCartIds = cartItems
    .reduce((set, cartItem) => set.add(cartItem.cartId), new Set<number>())
  log(`End deduplicating cart IDs`);

  log(`Start showing cart total price`);
  tx = await showCartTotalPrice(modelER, [...uniqueCartIds]);
  transactions.push(...tx);
  log(`End showing cart total price`);

  log(`Start writing transactions`);

  const summarizedTransactions = transactions.map((t) => {
    return { name: t.name, gasUsed: t.tx.receipt.gasUsed };
  });

  const dirPath = `${__dirname}/../data/transactions`;

  try {
    await fs.mkdir(dirPath);
  } catch (err) {
    console.error(err);
  }

  await fs.writeFile(
    `${dirPath}/er-model-tx.json`,
    JSON.stringify(transactions, null, 2),
    { flag: 'w' }
  );

  await fs.writeFile(
    `${dirPath}/er-model-tx-summ.json`,
    JSON.stringify(summarizedTransactions, null, 2),
    { flag: 'w' }
  );

  log(`Start writing transactions`);
}

async function populateProducts(modelER: ModelERInstance): Promise<Transaction[]> {
  const promises: Promise<Transaction>[] =
    products.map((product, i) => {
      const transaction = sendTransaction(modelER, 'addProduct', product.name, product.price)
        .then((tx) => {
          log(`${i + 1}/${products.length}: populate products { name: ${product.name}, price: ${product.price} }`);
          return { name: 'addProduct', tx, args: { name: product.name, price: product.price } } as Transaction;
        });

      return transaction;
    });

  const transactions = await Promise.all(promises);

  return transactions;
}

async function populateCartItems(modelER: ModelERInstance): Promise<Transaction[]> {
  const promises: Promise<Transaction>[] = cartItems.map((cartItem, i) => {
    const transaction = sendTransaction(modelER, 'addItemToCart', cartItem.cartId, cartItem.productId)
      .then((tx) => {
        log(`${i + 1}/${cartItems.length}: populate cart items { cartId: ${cartItem.cartId}, productId: ${cartItem.productId} }`);
        return { name: 'addItemToCart', tx, args: { cartId: cartItem.cartId, productId: cartItem.productId } } as Transaction;
      });

    return transaction;
  });


  const transactions = await Promise.all(promises);

  return transactions;
}

async function showCartTotalPrice(modelER: ModelERInstance, cartIds: number[]): Promise<Transaction[]> {
  const promises = cartIds.map((cartId, i) => {
    const transaction = sendTransaction(modelER, 'showTotal', cartId)
      .then((tx) => {
        log(`${i + 1}/${cartIds.length}: show cart total price { cartId: ${cartId} }`);
        return { name: 'showTotal', tx, args: { cartId } } as Transaction;
      });

    return transaction;
  });

  const transactions = await Promise.all(promises);

  return transactions;
}

function sendTransaction<T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>): Promise<Truffle.TransactionResponse<any>> {
  return taskManager
    .run(modelER, func, ...args)
}