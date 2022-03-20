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

  console.log(`[${new Date()}] Start populating products`);
  let tx = await populateProducts(modelER);
  transactions.push(...tx);
  console.log(`[${new Date()}] End populating products`);

  console.log(`[${new Date()}] Start populating cart items`);
  tx = await populateCartItems(modelER);
  transactions.push(...tx);
  console.log(`[${new Date()}] End populating cart items`);

  console.log(`[${new Date()}] Start deduplicating cart IDs`);
  const uniqueCartIds = cartItems
    .reduce((set, cartItem) => set.add(cartItem.cartId), new Set<number>())
  console.log(`[${new Date()}] End deduplicating cart IDs`);

  console.log(`[${new Date()}] Start showing cart total price`);
  for (const cartId of uniqueCartIds) {
    const tx = await showCartTotalPrice(modelER, cartId);
    transactions.push(tx);
  }
  console.log(`[${new Date()}] End showing cart total price`);

  console.log(`[${new Date()}] Start writing transactions`);

  const summarizedTransactions = transactions.map((t) => {
    return { name: t.name, gasUsed: t.tx.receipt.gasUsed };
  });

  const dirPath = `${__dirname}/../transactions`;

  try {
    await fs.mkdir(dirPath);
  } catch (err) {
    console.error(err);
  }

  await fs.writeFile(
    `${dirPath}/tx.json`,
    JSON.stringify(transactions, null, 2),
    { flag: 'w' }
  );

  await fs.writeFile(
    `${dirPath}/tx-summarized.json`,
    JSON.stringify(summarizedTransactions, null, 2),
    { flag: 'w' }
  );
  
  console.log(`[${new Date()}] Start writing transactions`);
}

async function populateProducts(modelER: ModelERInstance) {
  const transactions: Array<Transaction> = [];

  for (let product of products) {
    const transaction = await sendTransaction(modelER, 'addProduct', product.name, product.price);
    transactions.push({ name: 'addProduct', tx: transaction });
    console.log(`populate products { name: ${product.name}, price: ${product.price} }`);
  }

  return transactions;
}

async function populateCartItems(modelER: ModelERInstance) {
  const transactions: Transaction[] = [];

  let promises: Promise<Transaction>[] = [];
  for (let i = 0, cartItem = cartItems[i]; i < cartItems.length; i++, cartItem = cartItems[i]) {
    const transaction = sendTransaction(modelER, 'addItemToCart', cartItem.cartId, cartItem.productId)
      .then((t) => {
        console.log(`${i + 1}/${cartItems.length}: populate cart items { cartId: ${cartItem.cartId}, productId: ${cartItem.productId} }`);
        return { name: 'addItemToCart', tx: t } as Transaction;
      }); 
    promises.push(transaction);

    if ((i + 1) % 1000 == 0) {
      transactions.push(...(await Promise.all(promises)));
      promises = [];
    }
  }

  transactions.push(...(await Promise.all(promises)));

  return transactions;
}

async function showCartTotalPrice(modelER: ModelERInstance, cartId: number) {
  const transaction = await sendTransaction(modelER, 'showTotal', cartId);
  console.log(`show cart total price { cartId: ${cartId} }`);
  return { name: 'showTotal', tx: transaction } as Transaction;
}

async function sendTransaction<T extends keyof ModelERFunc>(modelER: ModelERInstance, func: T, ...args: Parameters<ModelERFunc[T]>): Promise<Truffle.TransactionResponse<any>> {
  // @ts-ignore (some functions does not have the sendTransaction function in their type annotation)
  return modelER[func].sendTransaction(...args)
}
