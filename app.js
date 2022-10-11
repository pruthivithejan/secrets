//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { request } = require('http');
const mongoose = require('mongoose');
const { ifError } = require('assert');
const { log } = require('console');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//mongoose connection
mongoose.connect('mongodb://localhost:27017/secretsDB' , {useNewUrlParser: true});

// userSchema

const userSchema = {
    email: String,
    password: String,
};

const User = new mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

// create user
app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
       password: req.body.password    
    });
    
    newUser.save(function (err, user){
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    }); 
});

// check user for login
app.post('/login', (req, res) => { 
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser){
        if (err){
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }   
        }
    });
});



app.listen(3000, function() {
   console.log("listening on port 3000"); 
});
