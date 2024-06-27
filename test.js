const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/has_db";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Подключено к MongoDB!");
    } finally {
        // Закрываем соединение после выполнения операции
        await client.close();
    }
}
run().catch(console.dir);