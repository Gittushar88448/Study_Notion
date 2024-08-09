const mongoose = require('mongoose')
require('dotenv').config();

const dbConnect = () =>{
    mongoose.connect(process.env.DATABASE_URL ,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(console.log("Connection established successfully"))
    .catch((error)=>{
        console.log("Failed to connect");
        console.error(error)
        process.exit(1);
    });
}

module.exports = dbConnect;