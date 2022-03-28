import erData from '../transactions/tx-summarized.json';
import { ModelERInstance } from '../types/truffle-contracts';
import fs from 'fs';

const addProductFuncName: keyof ModelERInstance['methods'] = 'addProduct';
const addItemToCartFuncName: keyof ModelERInstance['methods'] = 'addItemToCart';
const showTotalFuncName: keyof ModelERInstance['methods'] = 'showTotal';

const csvHeader = 'gas;transaction'

const addProduct = erData
  .filter((d) => d.name === addProductFuncName)
  .reduce((aggr, d, i) => {
    return `${aggr}\n${d.gasUsed};${i + 1}`;
  }, csvHeader);

const addItemToCart = erData
  .filter((d) => d.name === addItemToCartFuncName)
  .reduce((aggr, d, i) => {
    return `${aggr}\n${d.gasUsed};${i + 1}`;
  }, csvHeader);

const showTotal = erData
  .filter((d) => d.name === showTotalFuncName)
  .reduce((aggr, d, i) => {
    return `${aggr}\n${d.gasUsed};${i + 1}`;
  }, csvHeader);

fs.writeFileSync(`${__dirname}/../benchmark/er_model_${addProductFuncName}.csv`, addProduct);
fs.writeFileSync(`${__dirname}/../benchmark/er_model_${addItemToCartFuncName}.csv`, addItemToCart);
fs.writeFileSync(`${__dirname}/../benchmark/er_model_${showTotalFuncName}.csv`, showTotal);