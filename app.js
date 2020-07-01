const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

//mongodb setup
mongoose.connect("mongodb://charles_chou:112358@cluster0-shard-00-00-kfhsi.mongodb.net:27017,cluster0-shard-00-01-kfhsi.mongodb.net:27017,cluster0-shard-00-02-kfhsi.mongodb.net:27017/todolistDB?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listsSchema);
//mongodb setup

const item1 = new Item({
  name: 'Welcome'
});
const item2 = new Item({
  name: 'Beat yesterday'
});
const list1 = new List({
  name: '',
  items: item1
});
const list2 = new List({
  name: '',
  items: item2
});
const defaltitems = [item1, item2];

//use ejs as view engine
app.set('view engine', 'ejs');
//post request from website to server
app.use(bodyparser.urlencoded({
  extended: true
}));

app.use(express.static("public"));


//home route
app.route("/")
  .get(function(req, res) {

    var today = new Date();

    var options = {
      weekday: "long",
      day: "numeric",
      month: "long"
    };

    var day = today.toLocaleDateString("en-US", options);

    const defaltlists = [list1, list2];

    List.find({}, function(err, lists) {

      if (lists.length === 0) {

        //insert defalt data to database
        List.insertMany(defaltlists, function(err) {

          if (err) {
            console.log(err);
          } else {
            console.log("Success");
          }
        });
        res.redirect("/");
      } else {
        res.render("runs", {
          day: day,
          lists: lists
        });
      }

    });
  })
  .post(function(req, res) {
    itemName = req.body.newItem;
    listName = "";
    const item = new Item({
      name: itemName
    });
    const list = new List({
      name: listName,
      items: item
    });
    list.save();
    console.log(list);

    res.redirect("/");
  });


//work routes
app.route("/foods")
  .get(function(req, res) {

    var today = new Date();

    var options = {
      weekday: "long",
      day: "numeric",
      month: "long"
    };

    var day = today.toLocaleDateString("en-US", options);

    List.find({}, function(err, lists) {
      res.render("foods", {
        day: day,
        lists: lists
      });
    });
  })
  .post(function(req, res) {
    itemName = req.body.newItem;
    listName = "foods";
    const item = new Item({
      name: itemName
    });
    const list = new List({
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

    var today = new Date();

    var options = {
      weekday: "long",
      day: "numeric",
      month: "long"
    };

    var day = today.toLocaleDateString("en-US", options);

    List.find({}, function(err, lists) {
      res.render("other", {
        day: day,
        lists: lists
      });
    });
  })
  .post(function(req, res) {
    itemName = req.body.newItem;
    listName = "other";
    const item = new Item({
      name: itemName
    });
    const list = new List({
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
    res.redirect("/" + deleteListName);
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
