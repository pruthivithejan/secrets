//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { request } = require('http');
const mongoose = require('mongoose');
const { ifError } = require('assert');
const { log, profile } = require('console');

// requiring modules for passport.js
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

//OAuth configuration
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Initializing session
app.use(session({
    secret: process.env.SECRET,
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
    googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// Initializing Google OAuth20
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID ,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }

));


app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
       } else {
        res.render("home");
       }
});

// Google OAuth 2.0
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
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
