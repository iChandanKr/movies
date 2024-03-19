const mongoose = require("mongoose");
const dbConnection = () => {
  mongoose
    .connect(process.env.CONN_STRING)
    .then((conn) => {
      // console.log(conn);
      console.log("database is connected");
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = dbConnection;
