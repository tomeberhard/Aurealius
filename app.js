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

const groupSchema = new mongoose.Schema({
  name: String,
  entries: [entrySchema],
  userId: String
}, {
  timestamps: true
});

const Grouping = new mongoose.model("grouping", groupSchema);


//---Get Requests---///

app.get("/index", function(req, res) {

  Entry.find({}).sort({
    updatedAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          let uniqueGroupings = [...new Set(foundEntries.map(item => item.grouping))];

          res.render("index", {
            entries: foundEntries,
            groupings: uniqueGroupings
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

  //---Render the entries--//
  Entry.find({
    userId: userIdentifier
  }).sort({
    updatedAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          let uniqueGroupings = [...new Set(foundEntries.map(item => item.grouping))];

          res.render("user", {
            entries: foundEntries,
            groupings: uniqueGroupings
          });
        }
      }
    }
  });
});

app.post("/chosenCollection", function(req, res) {

  const collectionChosen = req.body.userCollectionChosen;

  if (req.isAuthenticated()) {
    const currentUserId = req.user._id;

    res.redirect("/user/" + currentUserId + "/collections/" + collectionChosen);
  }

});

app.get("/user/:currentUserId/collections/:grouping", function(req, res) {

  const userIdentifier = req.params.currentUserId;
  const grouping = req.params.grouping;

  //---Render the entries--//
  Entry.find({
    userId: userIdentifier,
    grouping: grouping
  }).sort({
    updatedAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          let uniqueGroupings = [...new Set(foundEntries.map(item => item.grouping))];

          res.render("usercollection", {
            entries: foundEntries,
            groupings: uniqueGroupings
          });
        }
      }
    }
  });
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

  function collectionAllocator() {
    const userCollectionChoice = req.body.grouping;

    if (userCollectionChoice === "") {
      let today = new Date();
      let dd = String(today.getDate());
      let mm = String(today.getMonth() + 1);
      let yyyy = today.getFullYear();

      today = mm + '/' + dd + '/' + yyyy;
      return today;
    } else {
      return userCollectionChoice;
    }
  }

  const currentUser = req.user.id;

  const newEntry = new Entry({
    imageFile: fileExists(),
    caption: req.body.caption,
    grouping: collectionAllocator(),
    userId: currentUser
  });

  Grouping.find({name: collectionAllocator(), userId: currentUser}, function(err, groupingNames) {
    if (err) {
      consoloe.log(err);
    } else {
      if(groupingNames != "") {
        Grouping.update(
          {name: collectionAllocator(), userId: currentUser},
          {$push: {entries: newEntry } }, function (err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully added entry to existing grouping.");
            }
          }
        );
        } else {
        const newGrouping = new Grouping({
          name: collectionAllocator(),
          entries: newEntry,
          userId: currentUser
        });
        newGrouping.save();
      }
    }
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


//---SERVER---///

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
