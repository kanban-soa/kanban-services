const express = require("express");

const app = express();

app.get("/", () => {

});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

export default app;
