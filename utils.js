// utils.js
const fs = require('fs');
const path = require('path');

// Optional colors (falls back to plain text if chalk isn't installed)
let chalk = null;
try { chalk = require('chalk'); } catch (_) { chalk = new Proxy({}, { get: () => (x) => x }); }

// Simple timestamped logger
const log = {
  info: (...args) => console.log(`[${new Date().toISOString()}]`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}][WARN]`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}][ERROR]`, ...args),
};

/** Sleep helper for rate limiting */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/** Readline helpers */
const readline = require('readline');

const createInterface = () =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

const askQuestion = (rl, q) =>
  new Promise((resolve) => rl.question(q, (ans) => resolve(ans?.trim())));

const confirm = async (rl, prompt = 'Are you sure? (y/N): ') => {
  const ans = (await askQuestion(rl, prompt))?.toLowerCase();
  return ans === 'y' || ans === 'yes';
};

/** Validators */
const requireNonEmpty = (value, fieldName = 'value') => {
  if (!value || !String(value).trim()) throw new Error(`${fieldName} cannot be empty.`);
  return String(value).trim();
};

const requireNumberInRange = (value, min, max, fieldName = 'number') => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}.`);
  }
  return n;
};

/** UI helpers */
const printHeading = (title) => {
  const line = '-'.repeat(Math.max(12, title.length + 4));
  console.log(chalk.cyan(line));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.cyan(line));
};

const printList = (items, render = (x) => String(x)) => {
  items.forEach((item, idx) => console.log(`${chalk.gray('#')}${idx + 1} ${render(item)}`));
};

/** Pagination + search */
const paginate = (array, page = 1, pageSize = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 20);
  const start = (p - 1) * size;
  const end = start + size;
  const totalPages = Math.max(1, Math.ceil(array.length / size));
  return { data: array.slice(start, end), page: p, pageSize: size, total: array.length, totalPages };
};

const searchByName = (items, query, getName = (x) => x.name || x?.name || '') => {
  if (!query) return items;
  const q = String(query).toLowerCase();
  return items.filter((it) => String(getName(it)).toLowerCase().includes(q));
};

/** Media helpers */
const maybeCreateMedia = async (client, mediaPath) => {
  if (!mediaPath) return null;
  const resolved = path.resolve(mediaPath);
  if (!fs.existsSync(resolved)) throw new Error(`File not found: ${resolved}`);
  const { MessageMedia } = require('whatsapp-web.js');
  return await MessageMedia.fromFilePath(resolved);
};

/** Return-to-menu prompt */
const returnToMenuPrompt = async (rl, showMainMenu, client, repeat = false) => {
  console.log();
  const msg = repeat ? 'Press Enter to repeat, or type "menu" to return: ' : 'Press Enter to return to menu: ';
  const ans = await askQuestion(rl, msg);
  if (repeat && ans.toLowerCase() !== 'menu') return true;
  await showMainMenu(client, rl);
  return false;
};

module.exports = {
  chalk,
  createInterface,
  askQuestion,
  confirm,
  requireNonEmpty,
  requireNumberInRange,
  printHeading,
  printList,
  paginate,
  searchByName,
  sleep,
  maybeCreateMedia,
  returnToMenuPrompt,
  log, // <-- exported logger
};
