import { MongoClient } from 'mongodb';



class DBClient {
  constructor () {
    const port = process.env.DB_PORT || 3000;
    const host = process.env.DB_HOST || 'localhost';
    const database = process.env.DB_Database || 'files_manager'
    const url = `mongodb://${host}:${port}/${database}`
    this.client = new MongoClient(url);
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection.find('users').countDocuments();
  }

  async nbFiles(){
    return this.client.db().collection.find('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;