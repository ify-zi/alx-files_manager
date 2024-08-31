import { createClient } from 'redis';
import { promisify }  from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.check = true;
    this.client.on('error', (err) => {
      console.log('Redis client not connected to the server:', err);
      this.check = false;
    });
  }

  isAlive() {
    return this.check;
  }

  async get(name) {
    const getter = promisify(this.client.GET).bind(this.client);
    const value = await getter(name);
    return value;
  }

  async set(key, value, duration) {
    const setter = promisify(this.client.SETEX).bind(this.client);
    await setter(key, duration, value);
  }

  async del(key) {
    const delKey = promisify(this.client.DEL).bind(this.client);
    await delKey(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;