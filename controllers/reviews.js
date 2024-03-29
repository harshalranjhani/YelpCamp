const Review = require("../models/review");
const Campground = require("../models/campground");
const User = require("../models/user");
const sendMail = require("../utils/sendHTMLMail");
const axios = require("axios");

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  console.log(campground.reviews.length);
  const review = new Review(req.body.review);
  console.log(req.user);
  if (campground.reviews.length === 1 || campground.reviews.length === 0) {
    campground.firstReviewer = req.user._id;
    req.user.firstReviewCount = req.user.firstReviewCount + 1;
    await User.updateOne(
      { _id: req.user._id },
      { $set: { firstReviewCount: req.user.firstReviewCount } }
    );
    mailObj = {
      email: req.user.email,
      name: req.user.username,
      campgroundName: campground.title,
    };
    const response = await axios.post(
      "https://harshalranjhaniapi.vercel.app/mail/firstReview",
      {
        mailObj,
      }
    );
    console.log(response);
  }
  review.author = req.user._id;
  campground.reviews.push(review);
  await review.save();
  await campground.save();
  req.flash("success", "Created New Review!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Successfully deleted the review!");
  res.redirect(`/campgrounds/${id}`);
};
