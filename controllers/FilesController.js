import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
const filePath = path.join(folderPath, uuidv4().toString());

export default class FilesController {
  static async postUpload(req, res) {
    /* get the user from the database using the X-token */
    const xtoken = req.headers['x-token'];
    const key = `auth_${xtoken}`;
    const userId = await redisClient.get(key);
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({"error": "Unauthorised"});
      return;
    }
    const files = dbClient.db.collection('files');

    /* handling inputs  and validations */
    const name = (req.body) ? req.body.name : null;
    const type = (req.body) ? req.body.type : null;
    const parentId = (req.body) && (req.body.parentId) ? req.body.parentId : 0;
    const isPublic = (req.body) && (req.body.isPublic) ? req.body.isPublic : false;
    const data = (req.body) ? req.body.data : '';
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || (type !== 'file' && type !== 'folder' && type !== 'image')) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    if (parentId) {
      const file = await files.findOne({ parentId });
      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    /* adding file to database */
    if (type === 'folder') {
      const newFile = await files.insertOne({
        userId: ObjectId(userId),
        name,
        type,
        data,
        parentId: parentId ? ObjectId(parentId) : 0,
        isPublic,
      });
      const file = await files.findOne({ _id: newFile.insertedId });
      res.status(201).send({
        id: newFile.insertedId,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,});
      return;
    }

    try {
      await fs.promises.mkdir(folderPath, { recursive: true });
    } catch (error) {
      // pass
    }
    try {
      await fs.promises.writeFile(filePath, data, {
        encoding: 'base64',
      });
    } catch (error) {
      res.status(400).json({ error: 'Cannot write to file' });
      return;
    }

    const newFile = await files.insertOne({
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId ? ObjectId(parentId) : 0,
      localPath: filePath,
     });
    const file = await files.findOne({ _id: newFile.insertedId });
    res.status(201).json({
      id: newFile.insertedId,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
    return;
  }
}