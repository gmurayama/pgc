import erData from '../transactions/tx-summarized.json';
import { ModelERInstance } from '../types/truffle-contracts';
import fs from 'fs';

const addProductFuncName: keyof ModelERInstance['methods'] = 'addProduct';
const addItemToCartFuncName: keyof ModelERInstance['methods'] = 'addItemToCart';
const showTotalFuncName: keyof ModelERInstance['methods'] = 'showTotal';

const addProductInitialData = {
  serie: { name: `${addProductFuncName} gas`, data: [] as number[] },
  categories: [] as string[]
};

const addItemToCartInitialData = {
  serie: { name: `${addItemToCartFuncName} gas`, data: [] as number[] },
  categories: [] as string[]
};

const showTotalInitialData = {
  serie: { name: `${showTotalFuncName} gas`, data: [] as number[] },
  categories: [] as string[]
};

const addProduct = erData
  .filter((d) => d.name === addProductFuncName)
  .reduce((aggr, d, i) => {
    return {
      serie: { name: `${addProductFuncName} gas`, data: [...aggr.serie.data, d.gasUsed] },
      categories: [...aggr.categories, `${i + 1}o entry`]
    };
  }, addProductInitialData);

const addItemToCart = erData
  .filter((d) => d.name === addItemToCartFuncName)
  .reduce((aggr, d, i) => {
    return {
      serie: { name: `${addItemToCartFuncName} gas`, data: [...aggr.serie.data, d.gasUsed] },
      categories: [...aggr.categories, `${i + 1}o entry`]
    };
  }, addItemToCartInitialData);

const showTotal = erData
  .filter((d) => d.name === showTotalFuncName)
  .reduce((aggr, d, i) => {
    return {
      serie: { name: `${showTotalFuncName} gas`, data: [...aggr.serie.data, d.gasUsed] },
      categories: [...aggr.categories, `${i + 1} products in cart`]
    };
  }, showTotalInitialData);

  const data = `var ${addProductFuncName} = ${JSON.stringify(addProduct)};
  var ${addItemToCartFuncName} = ${JSON.stringify(addItemToCart)};
  var ${showTotalFuncName} = ${JSON.stringify(showTotal)};`;

  fs.writeFileSync(`${__dirname}/../benchmark/er_model.js`, data);