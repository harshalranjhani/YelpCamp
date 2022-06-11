const User = require("../models/user");
const passport = require("passport");
const nodemailer = require("nodemailer");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yelpcamp.alerts@gmail.com",
    pass: process.env.APP_PASSWORD,
  },
});

const message =
  '<h1>Thanks for creating an account on <a href="experience-yelpcamp.herokuapp.com">Yelpcamp</a></h1>';

module.exports.renderRegisterForm = (req, res) => {
  res.render("users/register");
};

module.exports.registerUser = async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    const user = new User({ email, username, firstName, lastName });
    const registeredUser = await User.register(user, password);

    let mailDetails = {
      from: "yelpcamp.alerts@gmail.com",
      to: email,
      subject: "Test mail",
      html: message,
    };

    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log("Error Occurs", err);
      } else {
        console.log("Email sent successfully");
      }
    });
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Yelp Camp!");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  req.flash("success", "Welcome Back!");
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "Successfully Logged Out!");
  res.redirect("/campgrounds");
};
