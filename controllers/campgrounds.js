const Campground = require("../models/campground");
const User = require("../models/user");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");
const moment = require("moment");
const date = moment().format();

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports.index = async (req, res) => {
  const perPage = 10;
  const pageQuery = parseInt(req.query.page);
  const pageNumber = pageQuery ? pageQuery : 1;
  const noMatch = null;
  const allCampgroundsAvl = await Campground.find({});
  // console.log(allCampgroundsAvl);
  if (req.query.q) {
    const query = req.query.q;
    const regex = new RegExp(escapeRegex(req.query.q), "gi");
    const campgrounds = await Campground.find({ title: regex });
    const users = await User.find({
      $or: [{ username: regex }, { firstName: regex }, { lastName: regex }],
    });
    res.render("campgrounds/search", { campgrounds, users, query });
  } else {
    Campground.find({})
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec(function (err, allCampgrounds) {
        Campground.countDocuments().exec(function (err, count) {
          if (err) {
            console.log(err);
          } else {
            res.render("campgrounds/index", {
              campgrounds: allCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              noMatch: noMatch,
              page: "campgrounds",
              search: false,
              allCampgroundsAvl: allCampgroundsAvl,
            });
          }
        });
      });
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res) => {
  // if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
  try {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.postedOn = date;
    campground.author = req.user._id;
    campground.images = req.files.map((f) => ({
      url: f.path.replace("/upload", "/upload/w_1920,h_1080,c_fill"),
      filename: f.filename,
    }));
    console.log(date);
    await campground.save();
    // console.log(campground);
    req.flash("success", "Successfully made a new Campground!");
    res.redirect(`/campgrounds/${campground._id}`);
  } catch (e) {
    req.flash(
      "error",
      `Either the location was not found or the campground wasn't saved. Please try again.`
    );
    return res.redirect("/campgrounds");
  }
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Cannot find that campground");
    res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find that campground");
    res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  // console.log(req.body);
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  if (req.files.length > 0) {
    const imgs = req.files.map((f) => ({
      url: f.path.replace("/upload", "/upload/w_1920,h_1080,c_fill"),
      filename: f.filename,
    }));
    campground.images.push(...imgs);
  }
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
    // console.log(campground);
  }
  await campground.save();
  req.flash("success", "Successfully updated the Campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndDelete(id);
  for (let image of campground.images) {
    await cloudinary.uploader.destroy(image.filename);
  }
  req.flash("success", "Successfully deleted Campground!");
  res.redirect("/campgrounds");
};
