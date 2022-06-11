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

const message = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@700&display=swap');
        body{
            background-color: aliceblue;
            font-family: 'League Spartan', sans-serif;
        }
        button{
            border-radius: 5px;
            background-color: black;
            color: white;
            padding: 15px;
        }
    </style>
</head>
<body>
    <div class="container" style="width:500px ;height:500px;">
    <div style="display: block; margin:0 200px;">
        <img style="height: 2rem;" src="https://freepngimg.com/save/26767-welcome-picture/749x217" alt="YELPCAMP">
    </div>
    <div>
        <h1 style="text-align: center;">Welcome to YelpCamp, Hiker!</h1>
        <p style="text-align: center;">We are delighted to have you here.</p>
    </div>
    <div style=" display: block; margin:0 170px; width: 300px; cursor: pointer;">
    <a href="https://experience-yelpcamp.herokuapp.com/campgrounds/new"><button  style="cursor:pointer;">Add New Campground</button></a>
</div>
<div>
    <p style="text-align: center;">&copy; YelpCamp | 2022</p>
</div>
</div>
</body>
</html>`;

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
      subject: "Welcome to YelpCamp!",
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
