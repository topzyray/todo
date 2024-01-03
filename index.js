import dotenv from "dotenv"
dotenv.config({path: "./config.env"})

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT;

var conString = process.env.DATABASE_URL //Can be found in the Details page
var db = new pg.Client(conString);
db.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  db.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
    // db.end();
  });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkItems() {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    return result.rows;
  } catch (err) {
    console.error(err);
  }
}

app.get("/", async (req, res) => {
  const items = await checkItems();

  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", (req, res) => {
  const item = req.body.newItem;
    db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
});

app.post("/edit", async (req, res) => {
  const updatedItemId = req.body.updatedItemId;
  const updatedItemTitle = req.body.updatedItemTitle;

  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [updatedItemTitle, updatedItemId]);
    res.redirect('/')
  } catch (err) {
    console.error(err);
  }
});

app.post("/delete", async (req, res) => {
  const itemId = req.body.deleteItemId;
  try {
    await db.query("DELETE FROM items WHERE id = $1", [itemId]);
    res.redirect('/')
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
