var mysql = require('mysql');
const express = require('express');


const app = express();

const port = process.env.PORT || 3006;
app.listen(port);
//DB Tables
//users
//calisthenics
//weights
//favorites??
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Jsze5341!",
    database: "db"
});

db.connect(function (err) {
    if (err) {
        throw err;
    }
    console.log("Connection success");
});

module.exports = db;
