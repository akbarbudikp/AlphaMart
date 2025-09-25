require('dotenv').config();
const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');
const routes = require('./routes');
const { Profile } = require('./models')
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "keren_alphamart",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      sameSite: true,
    },
  })
);

app.use(flash())

app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error'); 
  res.locals.userRole = req.session.role; 
  res.locals.userId = req.session.userId; 

  if (req.session.userId) {
    try {
      const profile = await Profile.findOne({ where: { UserId: req.session.userId } });
      
      if (profile && profile.profilePicture) {
        res.locals.profilePictureUrl = profile.profilePicture;
      } else {
        res.locals.profilePictureUrl = 'https://i.imgur.com/V4RclNb.png'; 
      }
    } catch (error) {
      console.log("Error fetching profile for navbar:", error);
      res.locals.profilePictureUrl = 'https://i.imgur.com/V4RclNb.png';
    }
  }

  next();
})

app.use(routes)

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
