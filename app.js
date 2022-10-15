//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { request } = require('http');
const mongoose = require('mongoose');
const { ifError } = require('assert');
const { log } = require('console');

// requiring modules for passport.js
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Initializing session
app.use(session({
    secret: "Our Little Secret",
    resave: false,
    saveUninitialized: false,
}));

// Initializing passport
app.use(passport.initialize());
app.use(passport.session());


//mongoose connection
mongoose.connect('mongodb://localhost:27017/secretsDB' , {useNewUrlParser: true});

// userSchema
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
       } else {
        res.render("home");
       }
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets', (req, res) => {
   if (req.isAuthenticated()) {
    res.render("secrets");
   } else {
    res.redirect("/login");
   }
});

app.get('/logout', function(req, res)  {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
 });

// register user
app.post('/register', (req, res) => {

    User.register({username: req.body.username}, req.body.password, function(err, user) {
       if (err) {
          console.log(err);
          res.redirect("/register");
       } else {
          passport.authenticate("local") (req, res, function(){
             res.redirect("/secrets");
          });
       }
    });
});

// check user for login
app.post('/login', function(req, res) { 

    const user = new User({
        username: req.body.username,
        passport: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    })
});





app.listen(3000, function() {
   console.log("live on http://localhost:3000"); 
});
