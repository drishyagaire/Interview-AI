require("dotenv").config();
const app = require("../Backend/src/app");

// Connect to DB (but don't listen on a port!)
const connectToDB = require("../Backend/src/config/database");
connectToDB();

// For Vercel serverless
module.exports = (req, res) => {
  app(req, res);
};
