const generateMessage = require("../controllers/users");
const Token = require("../models/token");
const User = require("../models/user");
const sendMail = require("../utils/sendHTMLMail");
const crypto = require("crypto");

const verifyEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return 404;
    }
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}/users/${user._id}/verify/${token.token}`;
    const message = generateMessage(url);
    await sendMail(email, "Verify your Email!", message);
    return 200;
  } catch (e) {
    return e.message;
  }
};

module.exports = verifyEmail;
