//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { request } = require('http');
const mongoose = require('mongoose');
const { ifError } = require('assert');
const { log } = require('console');

//encryption constants
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//mongoose connection
mongoose.connect('mongodb://localhost:27017/secretsDB' , {useNewUrlParser: true});

// userSchema

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    
});

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

app.get('/logout', (req, res) => {
   res.render("home");	
});

// create user
app.post('/register', (req, res) => {

    bcrypt.hash(req.body.password, saltRounds,  function (err, hash){ 
        const newUser = new User({
            email: req.body.username,
           password: hash   
        });
        
        newUser.save(function (err, user){
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        }); 
    });   

});

// check user for login
app.post('/login', function(req, res) { 

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, foundUser) {
        if (err){
            console.log(err);
        } else {
            if (foundUser) {
                 bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result === true) {
                        res.render("secrets");
                    }
                 });   
                }
            }   
        });
    });





app.listen(3000, function() {
   console.log("live on http://localhost:3000"); 
});
