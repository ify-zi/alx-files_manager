import {v4 as uuidv4 } from 'uuid';
import sha1  from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    const authToken = authHeader.split(' ');
    const decodedToken = Buffer.from(authToken[1], 'base64').toString('utf-8');
    const detail = decodedToken.split(':');
    const email = detail[0];
    const password = detail[1];

    const users = dbClient.db.collection('users');
    const user = await users.findOne({ email });

    if (!user || (user.password !== sha1(password))) {
      res.status(401).json({error: "Unauthorised"});
    } else {
      const token = uuidv4();
      const key  = `auth_${token}`;
      await redisClient.set(key, user.id, 86400);;
      res.status(200).json({ token })
    }

  }

  static async getDisconnect(req, res) {
    const token = req.headers['X-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      res.status(401).json({error: "Unauthorized"});
    } else {
      await redisClient.del(key);
      res.status(204);
    }
  }
}
