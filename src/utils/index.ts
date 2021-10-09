/*
 * @Author: your name
 * @Date: 2021-09-27 10:24:15
 * @LastEditTime: 2021-10-09 18:03:56
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mzt.py/src/utils/index.ts
 */

import got from 'got';
import cheerio from 'cheerio';
import { host, userAgents } from './config';
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const projectDir = process.cwd();
const imgsDir = path.join(projectDir, 'images');
const userAgentsLen = userAgents.length;
/** 删除文件和创建文件 */
export const initFolderPlus = () => {
  fs.rmdirSync(imgsDir, { recursive: true });
  fs.mkdirSync(imgsDir);
};

/** 得到首页的总页数 */
export const getMaxPageNum = async () => {
  try {
    const res = await got(host, {
      headers: {
        userAgents: userAgents[Math.ceil(Math.random() * userAgentsLen)],
      },
      timeout: 3000,
    });
    const navList = cheerio.load(res.body)('.nav-links a');
    const countList = [];
    navList.each((index, item) => {
      const href = item.attribs.href;
      const arrSplit = href.split('/');
      const len = arrSplit.length;
      const current = arrSplit[len - 1 - 1];
      countList.push(current);
    });
    return Math.max(...countList);
  } catch (error) {
    console.log(chalk.red(error));
    return 0;
  }
};

/** 得到列表的所有项 */
export const getListImages = async (pageNum) => {
  const list = [];
  for (let sizeIndex = 1; sizeIndex <= pageNum; sizeIndex++) {
    try {
      const response = await got(`${host}/page/${sizeIndex}/`, {
        timeout: 3000,
      });
      const $ = cheerio.load(response.body);
      const resultDomList = $('#pins li');
      resultDomList.each((index, item) => {
        const a = $(item.children[0]);
        const span = item.children[1];
        const href = a.attr().href;
        const src = a.children().attr()['data-original'];
        const text = $(span).text();
        list.push({
          src,
          text,
          href,
        });
      });
    } catch (error) {
      console.log(chalk.red(error));
    }
  }
  return list;
};

/** 拿到每一项, 进行文件创建和下载图片 */
export const itemExport = async (list) => {
  for (let i = 0; i < list.length; i++) {
    await itemTitleImageExport(list[i]);
    await goItemDetailExport(list[i]);
  }
};

/** 对 list 的 title 进行下载 */
export const itemTitleImageExport = async (item) => {
  fs.mkdirSync(`./images/${item.text}`);
  try {
    const img = await got(item.src, {
      headers: {
        userAgents: userAgents[Math.ceil(Math.random() * userAgentsLen)],
        Referer: item.src,
      },
      timeout: 3000,
    });
    fs.writeFile(
      `${imgsDir}/${item.text}/main.jpg`,
      img.rawBody,
      (err, data) => {
        if (err) console.log(err);
        console.log(chalk.yellowBright(`[${item.text}]: `) + '下载成功 ⭐️ ');
      },
    );
  } catch (error) {
    console.log(chalk.red(error));
  }
};

/** 进入到 item 详情,并进行下载 */
export const goItemDetailExport = async (item) => {
  try {
    const response = await got(`${item.href}/1/`, { timeout: 3000 });
    const $ = cheerio.load(response.body);
    const pageNum = getItemDetailPageNum($);
    await downloadItemAllImagesFor(item, pageNum);
  } catch (error) {
    console.log(chalk.red(error));
  }
};

/** 找到 item 详情中 一共多少项 */
export const getItemDetailPageNum = (body) => {
  const navList = body('.pagenavi a');
  const current = navList[navList.length - 1 - 1];
  const text = current.children[0];
  return text.children[0].data;
};

/** 对 item 详情中的所有图片进行下载 */
export const downloadItemAllImages = async (item, i) => {
  try {
    const response = await got(`${item.href}/${i}/`, {
      timeout: 3000,
    });
    const $ = cheerio.load(response.body);
    const src = $('.main-image p a img').attr().src;
    const img = await got(src, {
      headers: {
        userAgents: userAgents[Math.ceil(Math.random() * userAgentsLen)],
        Referer: item.href,
      },
      timeout: 3000,
    });
    await fs.writeFile(
      `${imgsDir}/${item.text}/${i}.jpg`,
      img.rawBody,
      (err, data) => {
        if (err) console.log(err);
        console.log(
          chalk.yellowBright(`[${item.text}]: `) +
            chalk.blue(`[${i}]: `) +
            '下载成功 ⭐️ ',
        );
      },
    );
  } catch (error) {
    console.log(chalk.red(error));
  }
};

/** 对 item 详情中的所有图片进行下载 前的循环 */
export const downloadItemAllImagesFor = async (item, pageNum) => {
  for (let index = 1; index <= pageNum; index++) {
    await downloadItemAllImages(item, index);
  }
};
