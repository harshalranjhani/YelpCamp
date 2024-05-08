const User = require("../models/user");
const passport = require("passport");
const nodemailer = require("nodemailer");
const async = require("async");
const crypto = require("crypto");
const sendMail = require("../utils/sendHTMLMail");
const Token = require("../models/token");

let mailTransporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: "ranjhaniharshal@icloud.com",
    pass: process.env.APP_PASSWORD,
  },
});

function generateMessage(url) {
  return `<!DOCTYPE html>
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
          <h1 style="text-align: center;">Welcome to YelpCamp, Hiker! Let's get you verified.</h1>
          <p style="text-align: center;">We are delighted to have you here.</p>
      </div>
      <div style=" display: block; margin:0 170px; width: 300px; cursor: pointer;">
      <a href=${url}><button  style="cursor:pointer;">Verify Email</button></a>
  </div>
  <div>
      <p style="text-align: center;">&copy; YelpCamp | 2022</p>
  </div>
  </div>
  </body>
  </html>`;
}

module.exports = generateMessage;

module.exports.renderRegisterForm = (req, res) => {
  if (req.user) {
    req.logout();
    return res.redirect("/register");
  }
  res.render("users/register");
};

module.exports.registerUser = async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    const user = new User({ email, username, firstName, lastName });
    const registeredUser = await User.register(user, password);
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
    const message = generateMessage(url);
    await sendMail(email, "Welcome to YelpCamp!", message);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash(
        "success",
        "Welcome to Yelp Camp! Check your inbox to verify your email :)"
      );
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
};

module.exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      req.flash("error", "Invalid Link!");
      return res.redirect("/campgrounds");
      // return res.status(400).json({ message: "Invalid Link" });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token) {
      req.flash("error", "Invalid Link!");
      return res.redirect("/campgrounds");
      // return res.status(400).json({ message: "Invalid link" });
    }

    await user.updateOne({ isEmailVerified: true });
    await Token.deleteOne({ token: req.params.token })
      .then((res) => console.log(res))
      .catch((e) => console.log(e.message));
    req.flash("success", "Email verified successfully!");
    return res.redirect("/campgrounds");
    // return res.status(200).json({ message: "Email verified successfully." });
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
};

module.exports.renderLoginForm = (req, res) => {
  if (req.user) {
    return res.redirect("/campgrounds");
  }
  res.render("users/login");
};

module.exports.renderForgotForm = (req, res) => {
  res.render("users/forgot");
};

module.exports.sendResetMail = (req, res) => {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          let token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot-password");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done, next) {
        let mailTransporter = nodemailer.createTransport({
          service: process.env.SERVICE,
          auth: {
            user: "ranjhaniharshal@icloud.com",
            pass: process.env.APP_PASSWORD,
          },
        });
        const resetLink = `http://${req.headers.host}/reset/${token}`;
        const resetMessage = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You are receiving this because you (or someone else) have requested the reset of the password for your account</title>
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
                    cursor: pointer;
                }

                .buttonReset:hover{
                  background-color: white;
                  color: black;
                  font-weight: 700;
                }
            </style>
        </head>
        <body>
            <div class="container" style="width:500px ;height:500px; margin-left: 20%;">
            <p style="text-align:center;">You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
            <div>
                <h1 style="text-align: center;">Forgot your password? Ah, been there.</h1>
                <p style="text-align: center;">Don't worry we got it covered.</p>
            </div>
            <div style=" display: block; margin:0 170px; width: 300px; cursor: pointer;">
            <a href=${resetLink}><button class="buttonReset">Reset Password</button></a>
        </div>
        <p style="text-align: center;"><b>If you did not request this, please ignore this email and your password will remain unchanged.</b></p>
        <div>
            <p style="text-align: center;">&copy; YelpCamp | 2022</p>
        </div>
        </div>
        </body>
        </html>`;
        const mailOptions = {
          to: user.email,
          from: process.env.FROM,
          subject: "YelpCamp Account Password Reset",
          html: resetMessage,
          // "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
          // "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          // "http://" +
          // req.headers.host +
          // "/reset/" +
          // token +
          // "\n\n" +
          // "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        mailTransporter.sendMail(mailOptions, function (err) {
          // console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      console.log(err.message)
      return res.redirect("/forgot-password");
    }
  );
};

module.exports.renderResetForm = (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
      }
      res.render("users/reset", { token: req.params.token });
    }
  );
};

module.exports.resetPassword = (req, res) => {
  if (req.body.password !== req.body.confirm) {
    req.flash("error", "Passwords do not match.");
    console.log("passwords do not match");
    return res.redirect(req.get("referer"));
  }
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              console.log("passwords do not match");
              return res.redirect(req.get("referer"));
            }
          }
        );
      },
      function (user, done) {
        let mailTransporter = nodemailer.createTransport({
          service: process.env.SERVICE,
          auth: {
            user: "ranjhaniharshal@icloud.com",
            pass: process.env.APP_PASSWORD,
          },
        });
        const mailOptions = {
          to: user.email,
          from: process.env.FROM,
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        mailTransporter.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/campgrounds");
    }
  );
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
