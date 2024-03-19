const express = require("express");
const movieController = require("../controller/movieController");
const router = express.Router();
const middleware = require('../middleware');
const userController  = require('../controller/userController');

// importing middleware for id
// router.param('id',middleware.checkId);



router.get("/movies",userController.protect, movieController.getAllMovies);
router.post("/movie", movieController.createAmovie);
// router.get("/movies/:id", movieController.findAmovie);
// router.patch("/movies/:id", movieController.updateMovie);
// router.delete("/movies/:id",movieController.deleteMovie);

router
  .route("/movies/:id")
  .get(userController.protect,movieController.findAmovie)
  .patch(movieController.updateMovie)
  .delete(userController.protect,userController.restrict('admin'),movieController.deleteMovie);

module.exports = router;
