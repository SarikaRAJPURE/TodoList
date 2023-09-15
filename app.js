const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config();

const app = express();
const port = 3000;
let newItems = [];
let workItems = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//create new database inside mongodb
const connectDB= async()=>{
  try{
    mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.inm4poz.mongodb.net/todolistDB?retryWrites=true&w=majority`, { useNewUrlParser: true });
    console.log("Successfully connected to mongoDB");
  }catch(error){
    console.log("Connection failed!"+ error.message);
  }
}

connectDB();
//create a schema
const itemsSchema = {
  name: String
}

// create a mongoose model based on this schema
const Item = mongoose.model("Item", itemsSchema);
//create mongoose document
const newItem1 = new Item({
  name: "Fold the Laundry"
});
const newItem2 = new Item({
  name: "Make a Bed"
});
const newItem3 = new Item({
  name: "Clean floors"
});

const defaultItems = [newItem1, newItem2, newItem3];

//create a schema for list item home/work
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


/* var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
var today = new Date();
var day = today.toLocaleDateString("en-US", options); */


app.get('/', async (req, res) => {

  //console.log(today.toLocaleDateString("en-US")); // 9/17/2016
  // console.log(day); // Saturday, September 17, 2016
  const newItemsDB = await Item.find({});
  if (newItemsDB.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    //console.log(newItemsDB);
    res.render("index.ejs", { currentDay: "Today", newListItems: newItemsDB });
  }
});

app.get('/:customListName', async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);
  const result = await List.findOne({ name: customListName });
  if (!result) {
    console.log("List doesnt exist");
    const list = new List({
      name: customListName,
      items: defaultItems
    });
    list.save();
    console.log(list);
    res.redirect("/" + customListName);
  }
  else {
    console.log("List exist");
    res.render("index.ejs", { currentDay: result.name, newListItems: result.items });
  }
});

 app.post("/", async (req, res) => {

  let itemName = req.body.newItem;
  let listName = req.body.list;
  console.log(listName);

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    const foundList = await List.findOne({ name: listName });
    console.log(listName);
    console.log(foundList);
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }

}); 


app.post('/delete', async (req, res) => {
  //console.log(req.body.checkboxname);
  const checkedItemId = req.body.checkboxname;
  const listName = req.body.listName;
  if(listName === "Today"){
    const result = await Item.findByIdAndDelete(checkedItemId);
    console.log(`Item named ${result.name} deleted`);
    res.redirect("/");
  } else{
    const result = await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}});
    res.redirect("/"+listName);
  }
  
});


/* app.post("/work", (req, res) => {
    let newItem=req.body.newItem;
    workItems.push(newItem);
    res.redirect("/work");
    
  }); */
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});