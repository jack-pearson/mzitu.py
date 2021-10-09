/*
 * @Author: your name
 * @Date: 2021-09-26 19:16:53
 * @LastEditTime: 2021-09-28 10:34:11
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mzt.py/src/main.ts
 */
import {
  getListImages,
  getMaxPageNum,
  initFolderPlus,
  itemExport,
} from './utils';

/** 启动函数 */
async function start({ size = 1, deep = false }) {
  initFolderPlus();
  const maxPageNum = await getMaxPageNum();
  let pageNum = size;
  if (pageNum > maxPageNum) {
    pageNum = maxPageNum;
  }
  const list = await getListImages(pageNum);
  await itemExport(list);
}
start({ size: 1 });
