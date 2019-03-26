//jshint esversion: 6

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const findOrCreate = require("mongoose-findorcreate");

const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const path = require("path");
const crypto = require("crypto");

const fs = require("fs");

const app = express();

app.set("view engine", "ejs");


//--Middleware--//
app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride("_method"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

//--Create Mongo Connection--//
mongoose.connect("mongodb://localhost:27017/aurealiusUsersDB", {
  useNewUrlParser: true
});
// //below just to kill depracation warning//
mongoose.set('useCreateIndex', true);

const mongoURI = "mongodb://localhost:27017/aurealiusUsersDB";
const conn = mongoose.createConnection(mongoURI);

//--Init GridFs--//
let gfs;

//--Init Stream--//
conn.once("open", function() {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

//--Create storage engine--//
const storage = new GridFsStorage({
  url: mongoURI,
  file: function(req, file) {
    return new Promise(function(resolve, reject) {
      crypto.randomBytes(16, function(err, buf) {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);

const AurealiusUser = new mongoose.model("aurealiusUser", userSchema);

passport.use(AurealiusUser.createStrategy());

passport.serializeUser(AurealiusUser.serializeUser());
passport.deserializeUser(AurealiusUser.deserializeUser());

const entrySchema = new mongoose.Schema({
  imageFile: String,
  caption: String,
  grouping: String,
  userId: String
}, {
  timestamps: true
});

const Entry = new mongoose.model("entry", entrySchema);

//---Get Requests---///

app.get("/index", function(req, res) {

  Entry.find({}).sort({updatedAt: -1}).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {
          res.render("index", {
            entries: foundEntries
          });
        }
      }
    }
  });

});

app.get("/user", function(req, res) {

  const currentUserId = req.user._id;

  if (req.isAuthenticated()) {
    res.redirect("/user/" + currentUserId);
  }
});

app.get("/user/:currentUserId", function(req, res) {

  const userIdentifier = req.params.currentUserId;

  Entry.find({userId: userIdentifier}).sort({updatedAt: -1}).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {
          res.render("user", {
            entries: foundEntries
          });
        }
      }
    }
  });

});

app.get("/example", function(req, res) {
  res.render("example");
});

//--display all files in json--//
app.get("/files", function(req, res) {
  gfs.files.find().toArray(function(err, files) {
    //-check if files exist-//
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "No Files Exist."
      });
    } else {
      //-files exist-//
      return res.json(files);
    }
  });
});

//--filename specific path, display single file object--//
app.get("/files/:filename", function(req, res) {
  gfs.files.findOne({
    filename: req.params.filename
  }, function(err, file) {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No File Exist."
      });
    } else {
      //-file exist-//
      return res.json(file);
    }
  })

});

//--filename specific path--//
app.get("/image/:filename", function(req, res) {
  (gfs.files.findOne({
    filename: req.params.filename
  }, function(err, file) {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No File Exist."
      });
    } else {
      //--Check if file an image file--//
      if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
        //-read output to browser-//
        res.set("Content-Type", "image/jpeg");
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({
          err: "Not an Image."
        });
      }
    }
  }));
});

app.post("/upload", upload.single("file"), function(req, res) {

  function fileExists() {
    if (typeof req.file === "undefined") {
      let fileName = "NOTHING TO SEE HERE";
      return fileName
    } else {
      let fileName = req.file.filename;
      return fileName
    }
  }

    const newEntry = new Entry({
      imageFile: fileExists(),
      caption: req.body.caption,
      userId: req.user.id
    });
  newEntry.save();
  res.redirect("back");
});

app.post("/delete", function(req, res) {

  Entry.deleteOne({
    imageFile: req.body.deleteButton
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully deleted entry.");
    }
  });

  gfs.remove({
    filename: req.body.deleteButton,
    root: "uploads"
  }, function(err) {
    if (err) {
      return res.status(404).json({
        err: err
      });
    } else {
      res.redirect("user");
    }
  });
});


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/privacy", function(req, res) {
  res.render("privacy");
});

app.get("/terms", function(req, res) {
  res.render("terms");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/activity", function(req, res) {

  res.render("/activity");

  //   Entry.find({"caption": {$ne: null}}, function(err, foundEntries){
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       if (foundEntries) {
  //         if (req.isAuthenticated()) {
  //           res.render("activity", {userEntries:foundEntries});
  //         } else {
  //           res.redirect("/login")
  //         }
  //       }
  //     }
  //   });
});

//---POST Requests---///

app.post("/register", function(req, res) {

  AurealiusUser.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/index");
      });
    }
  });
});

app.post("/", function(req, res) {

  const user = new AurealiusUser({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("login")
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("index");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new AurealiusUser({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("login")
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("index");
      });
    }
  });
});

app.post("/activity", function(req, res) {

  const entry = new Entry({
    caption: req.body.entryCaption,
    userId: req.user.id
  });

  entry.save();
  res.redirect("activity");

  // upload(req, res, function(err) {
  //   if (err) {
  //     res.render("activity", {
  //       msg: err
  //     });
  //   } else {
  //     if (req.file == undefined) {
  //       res.render("activity", {
  //         msg: "Error: No File Selected!"
  //       });
  //     } else {
  //       res.render("activity");
  //     }
  //   }
  // });
});





//---SERVER---///

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
