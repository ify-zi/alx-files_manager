import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    const user = await users.findOne({ email });
    if (user) {
      res.status(401).json({ error: 'Already exist' });
      return;
    }

    const newUser = await users
      .insertOne({ email, password: sha1(password) });
    const userId = newUser.insertedId;
    if(newUser){
    res.status(201).json({ id: userId, email });
    return;
    }
  }

  static async getMe(req, res) {
    const xToken = req.headers['x-token'];
    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ _id: ObjectId(userId) });
    if (user) {
      res.json({ id: user._id, email: user.email});
      return;
    } else {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
  }
}