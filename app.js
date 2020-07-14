require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

var day;
var dateData;
var email;
var password;
var profileId;
var historySwich = false;

app.use(session({
  secret: "Todolist",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//mongodb setup
mongoose.connect("mongodb://charles_chou:112358@cluster0-shard-00-00-kfhsi.mongodb.net:27017,cluster0-shard-00-01-kfhsi.mongodb.net:27017,cluster0-shard-00-02-kfhsi.mongodb.net:27017/todolistDB?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const logDateSchema = new mongoose.Schema({
  date: String
});

const LogDate = mongoose.model("LogDate", logDateSchema);

const listsSchema = new mongoose.Schema({
  users: [userSchema],
  date: String,
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listsSchema);
//mongodb setup


//use ejs as view engine
app.set('view engine', 'ejs');
//post request from website to server
app.use(bodyparser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

function getDate(){
  var today = new Date();

  var options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  day = today.toLocaleDateString("en-US", options);
};

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//google login
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/runs",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    profileId = profile.id;
    return cb(err, user);
  });
}
));

//beginning
app.route("/")
  .get(function(req, res) {
    getDate();

    List.find({}, function(err, lists) {
      res.render("biginning", {
        day: day,
        lists: lists
      });
    });
  })

//registration route
app.route("/register")
  .get(function(req, res) {
    getDate();

    List.find({}, function(err, lists) {
      res.render("register", {
        day: day,
        lists: lists
      });
    });
  })
  .post(function(req, res){
    email = req.body.username;
    password = req.body.password;
    User.register({username: email}, password, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/runs");
        });
      }
    });
  });

//login route
app.route("/login")
  .get(function(req, res) {
    getDate();

    List.find({}, function(err, lists) {
      res.render("login", {
        day: day,
        lists: lists
      });
    });
  })
  .post(function(req, res){
    email = req.body.username;
    password = req.body.password;
    const user = new User({
      username: email,
      password: password,
      googleId: profileId
    });
  
    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/runs");
        });
      }
    });

  });

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/runs",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/runs");
  });

app.get("/logout", function(req, res){
  email = "";
  profileId = "";
  req.logout();
  res.redirect("/");
});

//about route
app.route("/about")
.get(function(req, res) {

  getDate();

  List.find({}, function(err, lists) {
    res.render("about", {
      day: day,
      lists: lists
    });
  });
});

//hostory
app.route("/history/:data")
.get(function(req, res) {
  historySwich = true;
  getDate();
  dateData = req.params.data;
  console.log(dateData);

  List.find({}, function(err, lists) {
    res.render("history", {
      day: day,
      lists: lists,
      dateData: dateData
    });
  });
})


//home route
app.route("/runs")
  .get(function(req, res) {
    historySwich = false;

    if (req.isAuthenticated){
      getDate();

    List.find({}, function(err, lists) {
      res.render("runs", {
        day: day,
        lists: lists,
        email: email,
        profileId: profileId
      });
    });

    }else{
      res.redirect("/login");
    }
    
  })
  .post(function(req, res) {

    itemName = req.body.newItem;
    listName = "";

    const user = new User({
      email: email,
      password: password,
      googleId: profileId
    });
    const item = new Item({
      name: itemName
    });
    const list = new List({
      users: user,
      date: day,
      name: listName,
      items: item
    });
    list.save();
    console.log(list);

    res.redirect("/runs");
  });


//work routes
app.route("/foods")
  .get(function(req, res) {
    historySwich = false;

    getDate();

    List.find({}, function(err, lists) {
      res.render("foods", {
        day: day,
        lists: lists,
        email: email,
        profileId: profileId
      });
    });
  })
  .post(function(req, res) {
    itemName = req.body.newItem;
    listName = "foods";
    const user = new User({
      email: email,
      password: password,
      googleId: profileId
    });
    const item = new Item({
      name: itemName
    });
    const list = new List({
      users: user,
      date: day,
      name: listName,
      items: item
    });
    list.save();
    console.log(list);

    res.redirect("/foods");
  });


//other route
app.route("/other")
  .get(function(req, res) {
    historySwich = false;

    getDate();

    List.find({}, function(err, lists) {
      res.render("other", {
        day: day,
        lists: lists,
        email: email,
        profileId: profileId
      });
    });
  })
  .post(function(req, res) {
    itemName = req.body.newItem;
    listName = "other";
    const user = new User({
      email: email,
      password: password,
      googleId: profileId
    });
    const item = new Item({
      name: itemName
    });
    const list = new List({
      users: user,
      date: day,
      name: listName,
      items: item
    });
    list.save();
    console.log(list);

    res.redirect("/other");
  });


//delete route
app.post("/delete", function(req, res) {
  var deleteListId = req.body.checkbox;
  var deleteListName;

  List.findByIdAndDelete(deleteListId, function(err, list) {
    deleteListName = list.name;
    if (deleteListName === "" && historySwich == false){
      res.redirect("/runs");
    }else if (deleteListName.length == 5 && historySwich == false){
      res.redirect("/" + deleteListName);
    }else{
      res.redirect("/history/" + dateData);
    }
    
  });

});


//ports
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("server is running");
});
