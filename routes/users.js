const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Campground = require("../models/campground");
const catchAsync = require("../utils/catchAsync");
const passport = require("passport");
const users = require("../controllers/users");
const { isLoggedIn } = require("../middleware");
const { forEach } = require("async");

router
  .route("/register")
  .get(users.renderRegisterForm)
  .post(catchAsync(users.registerUser));

router
  .route("/login")
  .get(users.renderLoginForm)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

router
  .route("/forgot-password")
  .get(users.renderForgotForm)
  .post(users.sendResetMail);

router
  .route("/reset/:token")
  .get(users.renderResetForm)
  .post(users.resetPassword);

router.get("/logout", users.logout);

router.get(
  "/dashboard/:id",
  isLoggedIn,
  catchAsync(async (req, res) => {
    try {
      const perPage = 10;
      const pageQuery = parseInt(req.query.page);
      const pageNumber = pageQuery ? pageQuery : 1;
      const noMatch = null;
      const { id } = req.params;
      const user = await User.findById(id);
      Campground.find({})
        .where("author")
        .equals(user._id)
        .skip(perPage * pageNumber - perPage)
        .limit(perPage)
        .exec(function (err, allCampgrounds) {
          Campground.countDocuments().exec(function (err, count) {
            if (err) {
              console.log(err);
            } else {
              const allGoodCampgrounds = allCampgrounds.filter((campground) =>
                campground.images.filter(
                  (image) =>
                    image.url.endsWith("png") ||
                    image.url.endsWith("jpg") ||
                    image.url.endsWith("jpeg")
                )
              );
              // forEach(())
              console.log(allGoodCampgrounds);
              res.render("users/dashboard", {
                campgrounds: allCampgrounds,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
                page: "campgrounds",
                search: false,
                user,
              });
            }
          });
        });
      // const campgrounds = await Campground.find().where('author').equals(user._id)
      // res.render(`users/dashboard`, { user, campgrounds });
      // console.log(campgrounds);
    } catch (e) {
      req.flash("error", "User not found");
      console.log(e);
      return res.redirect("/campgrounds");
    }
  })
);

module.exports = router;
