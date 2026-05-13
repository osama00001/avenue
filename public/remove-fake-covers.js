const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://bstteam108:Bstteam108@cluster0.kyrpu.mongodb.net/avenue?retryWrites=true&w=majority&appName=Cluster0');
  const db = mongoose.connection.db;
  
  const fakeDir = path.join(__dirname, 'fakedemocovers');
  const files = fs.readdirSync(fakeDir);
  const isbns = files.map(f => path.parse(f).name);
  
  const result = await db.collection('books').updateMany(
    { recordReference: { $in: isbns } },
    { $unset: { coverImage: "" } }
  );
  
  console.log(`Unlinked fake covers for ${result.modifiedCount} books.`);
  process.exit(0);
}

run().catch(console.error);
