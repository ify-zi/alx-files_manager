import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    const client = createClient();
    client.on('connect', () => {
      console.log("Redis client is connected to server").on("error", (err) => {
        console.error("Redis client is not connected to server")
      });
    })
  }

  isAlive() {
    if (this.client) {
      return true;
    } else {
      return false;
    }
  }

  async get(name) {
    await promisify(this.client.GET).bind(this.client)(name);
  }

  async set(key, value, duration) {
    await promisify(this.client.SETEX).bind(this.client)(key, value, duration);
  }

  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;