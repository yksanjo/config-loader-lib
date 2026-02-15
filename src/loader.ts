import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface ConfigSource {
  type: 'file' | 'env';
  path?: string;
}

export class ConfigLoader {
  private sources: ConfigSource[] = [];

  addFile(path: string): this {
    this.sources.push({ type: 'file', path });
    return this;
  }

  addEnv(): this {
    this.sources.push({ type: 'env' });
    return this;
  }

  load<T = Record<string, unknown>>(prefix = ''): T {
    const config: Record<string, unknown> = {};

    for (const source of this.sources) {
      if (source.type === 'file' && source.path) {
        if (existsSync(source.path)) {
          const content = readFileSync(source.path, 'utf-8');
          const ext = source.path.split('.').pop()?.toLowerCase();
          
          if (ext === 'json') {
            Object.assign(config, JSON.parse(content));
          } else if (ext === 'js' || ext === 'ts') {
            const mod = require(resolve(source.path));
            Object.assign(config, mod.default || mod);
          }
        }
      } else if (source.type === 'env') {
        for (const [key, value] of Object.entries(process.env)) {
          const targetKey = prefix ? key.replace(prefix, '') : key;
          config[targetKey.toLowerCase()] = value;
        }
      }
    }

    return config as T;
  }
}
