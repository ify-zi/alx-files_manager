import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');
    const user = await users.findOne({ email });
    if (user) {
      res.status(401).json({ error: 'Already exist' });
      return;
    }

    const insertInfo = await users
      .insertOne({ email, password: sha1(password) });
    const userId = insertInfo.insertedId.toString();

    res.status(201).json({ email, id: userId });
  }

  static async getMe(req, res) {
    const xtoken = req.headers['X-token'];
    const key = `auth_${xtoken}`;
    const userId = await redisClient.get(key);
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ userId });
    if (user) {
      res.json({ email: user.email, id: user._id });
    } else {
      res.status(401).json({ error: 'Unauthorised' });
    }
  }
}