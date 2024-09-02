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
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const files = dbClient.db.collection('files');

    /* handling inputs  and validations */
    const name = (req.body) ? req.body.name : null;
    const type = (req.body) ? req.body.type : null;
    const parentId = (req.body) && (req.body.parentId) ? req.body.parentId : 0;
    const isPublic = (req.body) && (req.body.isPublic) ? req.body.isPublic : false;
    const data = (req.body) ? req.body.data : '';
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || (type !== 'file' && type !== 'folder' && type !== 'image')) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const file = await files.findOne({ parentId });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
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
      return res.status(201).json({
        id: newFile.insertedId,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
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
      return res.status(400).json({ error: 'Cannot write to file' });
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
    return res.status(201).json({
      id: newFile.insertedId,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getShow(req, res) {
    const xToken = req.headers['x-token'];
    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const fileId = req.params.id;
    const files = dbClient.db.collection('files');
    const file = await files.findOne({ userId: ObjectId(userId), _id: ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: 'Not Found' });
    }
    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const xToken = req.headers['x-token'];
    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query ? req.query.parentId : 0;
    const page = req.query ? req.query.page : 0;

    const filesCollection = dbClient.db.collection('files');
    const pipeline = [
      {
        $match: {
          userId: ObjectId(userId),
          parentId: parentId === '0' ? 0 : ObjectId(parentId),
        },
      },
      {
        $skip: parseInt(page, 10) * 20,
      },
      {
        $limit: 20,
      },
    ];

    const files = await filesCollection.aggregate(pipeline).toArray();

    return res.status(200).json({ files });
  }
}