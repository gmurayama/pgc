import products from '../data/seed/products.json';
import cartItems from '../data/seed/cartItems.json';
import fs from 'fs/promises';
import type { ModelERInstance } from '../types/truffle-contracts';
import TaskManager from './helper/taskManager';

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
  for (const cartId of uniqueCartIds) {
    const tx = await showCartTotalPrice(modelER, cartId);
    transactions.push(tx);
  }
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

async function populateProducts(modelER: ModelERInstance) {
  const transactions: Array<Transaction> = [];

  for (let product of products) {
    const transaction = await sendTransaction(modelER, 'addProduct', product.name, product.price);
    transactions.push({ name: 'addProduct', tx: transaction, args: { name: product.name, price: product.price } });
    log(`populate products { name: ${product.name}, price: ${product.price} }`);
  }

  return transactions;
}

async function populateCartItems(modelER: ModelERInstance) {
  let promises: Promise<Transaction>[] = [];

  for (let i = 0, cartItem = cartItems[i]; i < cartItems.length; i++, cartItem = cartItems[i]) {
    const transaction = sendManagedTransaction(modelER, 'addItemToCart', cartItem.cartId, cartItem.productId)
      .then((t) => {
        log(`${i + 1}/${cartItems.length}: populate cart items { cartId: ${cartItem.cartId}, productId: ${cartItem.productId} }`);
        return { name: 'addItemToCart', tx: t, args: { cartId: cartItem.cartId, productId: cartItem.productId } } as Transaction;
      });

    promises.push(transaction);
  }

  const tx = await Promise.all(promises);

  return tx;
}

async function showCartTotalPrice(modelER: ModelERInstance, cartId: number) {
  const transaction = await sendTransaction(modelER, 'showTotal', cartId);
  log(`show cart total price { cartId: ${cartId} }`);
  return { name: 'showTotal', tx: transaction, args: { cartId } } as Transaction;
}

function sendTransaction<T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>): Promise<Truffle.TransactionResponse<any>> {
  // @ts-ignore (some functions does not have the sendTransaction function in their type annotation)
  return modelER[func].sendTransaction(...args)
}

function sendManagedTransaction<T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>): Promise<Truffle.TransactionResponse<any>> {
  return taskManager
    .run(modelER, func, ...args)
}

function log(message) {
  const date = new Date();
  const hours = formatTime(date.getHours());
  const minutes = formatTime(date.getMinutes());
  const seconds = formatTime(date.getSeconds());
  const milliseconds = formatMilliseconds(date.getMilliseconds());
  console.log(`[${hours}:${minutes}:${seconds}.${milliseconds}] ${message}`);
}

function formatTime(time: number) {
  if (time < 10) {
    return `0${time}`;
  }

  return String(time);
}

function formatMilliseconds(time: number) {
  if (time < 10) {
    return `00${time}`;
  }

  if (time < 100) {
    return `0${time}`;
  }

  return String(time);
}