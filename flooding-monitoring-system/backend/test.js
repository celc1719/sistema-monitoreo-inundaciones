const mongoose = require('mongoose');

const uri = "mongodb+srv://Maxcizo:4J8asbQnJqCK2taH@cluster0.kbtyrih.mongodb.net/?appName=Cluster0";

mongoose.connect(uri)
  .then(() => console.log("Conectado ✅"))
  .catch(err => console.error("Error Mongo:", err));
