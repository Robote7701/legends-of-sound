import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

export const USER_AGENT = 'LegendsOfSound/0.1 (https://github.com/Robote7701/legends-of-sound)';
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function writeJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
  // Windows sync/antivirus tools can briefly hold a destination file open.
  // Retry the atomic rename; never delete the previous file as a workaround.
  for (let attempt = 0; ; attempt++) {
    try { await rename(temporary, file); return; }
    catch (error) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt >= 7) throw error;
      await sleep(100 * (attempt + 1));
    }
  }
}

export class ApiClient {
  constructor(cacheDir, { fetchImpl = fetch, wait = sleep, interval = 1150 } = {}) {
    this.cacheDir = cacheDir;
    this.fetch = fetchImpl;
    this.wait = wait;
    this.interval = interval;
    this.lastRequest = 0;
    this.blockedUntil = 0;
    this.queue = Promise.resolve();
  }
  async reserve() {
    const previous = this.queue;
    let release;
    this.queue = new Promise(resolve => { release = resolve; });
    await previous;
    try {
      await this.wait(Math.max(0, this.interval - (Date.now() - this.lastRequest), this.blockedUntil - Date.now()));
      this.lastRequest = Date.now();
    } finally { release(); }
  }
  async get(url) {
    const file = path.join(this.cacheDir, createHash('sha256').update(url).digest('hex') + '.json');
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    for (let attempt = 0; attempt < 5; attempt++) {
      await this.reserve();
      let response;
      try {
        response = await this.fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
      } catch (error) {
        if (attempt === 4) throw error;
        await this.wait(2000 * 2 ** attempt); continue;
      }
      if ([429, 500, 502, 503, 504].includes(response.status)) {
        const retry = response.headers.get('retry-after');
        const delay = retry ? (Number.isFinite(Number(retry)) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
        const pause = Math.max(delay || 0, 2000 * 2 ** attempt);
        this.blockedUntil = Math.max(this.blockedUntil, Date.now() + pause);
        await this.wait(pause);
        continue;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status + ' : ' + url);
      const data = await response.json();
      if (['maxlag', 'ratelimited', 'cirrussearch-too-busy-error'].includes(data.error?.code)) {
        this.blockedUntil = Math.max(this.blockedUntil, Date.now() + 2000 * 2 ** attempt);
        await this.wait(2000 * 2 ** attempt); continue;
      }
      if (data.error || data.errors) throw new Error('Erreur API : ' + JSON.stringify(data.error || data.errors));
      const envelope = { url, fetchedAt: new Date().toISOString(), data };
      await writeJSON(file, envelope);
      return envelope;
    }
    throw new Error('API indisponible après cinq essais : ' + url);
  }
}
