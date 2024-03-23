const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.static("./"));
app.use(cors());

//app.get("/", function (req, res) {
  //res.sendFile(path.resolve("login.html"));
//});

const PORT =  5500;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});






