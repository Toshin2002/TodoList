const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect('mongodb+srv://todoList:Happy123@cluster0.euqo9.mongodb.net/todoListDB?retryWrites=true&w=majority');

const itemSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemSchema]
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: "Item 1"
});
const item2 = new Item({
    name: "Item 2"
});
const item3 = new Item({
    name: "Item 3"
});

const defaultItems = [item1, item2, item3];

//including bodyparser setting up ejs and use of css when html or ejs page is hosted by server
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", function (req, res) {
    // const currday = date.getDate();          just to simplify
    Item.find(function (err, foundItems) {
        if (foundItems.length == 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Default items saved to database successfully.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newitems: foundItems });
        }

    });
});

app.get("/:customListName", function (req, res) {
    const listName = _.capitalize(req.params.customListName);

    var newlist = new List({
        name: listName,
        items: defaultItems
    });
    List.findOne({ name: listName }, function (err, foundlist) {
        if (!err) {
            if (!foundlist) {
                newlist.save();
                res.redirect("/" + req.params.customListName);
            } else {
                res.render("list", { listTitle: foundlist.name, newitems: foundlist.items });
            }
        } else {
            console.log(err);
        }
    })

})


// POST ROUTES


app.post("/", function (req, res) {

    const fresh = new Item({
        name: req.body.newitem
    });
    if (req.body.list == "Today") {
        if (req.body.newitem == "") {
            res.redirect("/");
        } else {
            fresh.save();
            res.redirect("/");
        }

    } else {
        List.findOne({ name: req.body.list }, function (err, foundlist) {
            if (!err) {
                let a = 0;
                let already = foundlist.items
                already.forEach(function (it) {
                    if (it.name == fresh.name) {
                        a = 1;
                    }
                })
                if (a == 0) {
                    foundlist.items.push(fresh);
                    foundlist.save();
                }
                res.redirect("/" + req.body.list);
            } else {
                console.log(err);
            }

        })
    }

});

//deleting items form a list 

app.post("/delete", function (req, res) {
    const list_Name = req.body.listName;

    if (list_Name === "Today") {
        Item.findByIdAndRemove(req.body.done, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted successfully");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({ name: list_Name }, { $pull: { items: { _id: req.body.done } } }, function (err, foundlist) {
            if (!err) {
                res.redirect("/" + list_Name);
            }
        });
    }

});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("listening to port 3000");
})
