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

const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const fs = require("fs");

const app = express();

app.set("view engine", "ejs");

// import 'simplebar/dist/simplebar.css'

//-----------------------Middleware-----------------------------------//
app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//-------------------Create Mongo Connection--------------------------//
mongoose.connect("mongodb://localhost:27017/aurealiusUsersDB", {
  useNewUrlParser: true
});
//below just to kill depracation warning//

mongoose.set('useCreateIndex', true);
//kills error from findOneandUpdate//
mongoose.set('useFindAndModify', false);

const mongoURI = "mongodb://localhost:27017/aurealiusUsersDB";
const conn = mongoose.createConnection(mongoURI);

//--------------------Init GridFs--------------------------------------//
let gfs;

//--------------------Init Stream--------------------------------------//
conn.once("open", function() {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

//--------------------Create storage engine----------------------------//
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

//---------------------Mongo Moongoose Models--------------------------//
const ObjectId = mongoose.Schema.Types.ObjectId;

const entrySchema = new mongoose.Schema({
  imageFile: String,
  caption: String,
  _grouping:  {
    type: ObjectId,
    ref: "grouping"
  },
  _user: {
    type: ObjectId,
    ref: "aurealiusUser"
  },
  _favoriteUsers: [{
    type: ObjectId,
    ref: "aurealiusUser"
  }],
  viewStatus: String,
  reportStatus: String
}, {
  timestamps: true
});

const Entry = new mongoose.model("entry", entrySchema);

const groupingSchema = new mongoose.Schema({
  groupingName: String,
  groupingImageFile: String,
  _user: {
    type: ObjectId,
    ref: "aurealiusUser"
  },
  _entries: [{
    type: ObjectId,
    ref: "entry"
  }],
  viewStatus: String
}, {
  timestamps: true
});

const Grouping = new mongoose.model("grouping", groupingSchema);

const userSchema = new mongoose.Schema({
  // userName: String,
  profileName: String,
  firstName: String,
  lastName: String,
  bioImageFile: String,
  googleId: String,
  facebookId: String,
  _entries: [{
    type: ObjectId,
    ref: "entry"
  }],
  _favorites: [{
    type: ObjectId,
    ref: "entry"
  }],
  _groupings: [{
    type: ObjectId,
    ref: "grouping"
  }],
  _groupingFavorites: [{
    type: ObjectId,
    ref: "grouping"
  }],
  _followers: [{
    type: ObjectId,
    ref: "aurealiusUser"
  }],
  _following: [{
    type: ObjectId,
    ref: "aurealiusUser"
  }],
  reports: Number,
  sessions: Number,
  reminderSettings: Object,
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email"
});

const AurealiusUser = new mongoose.model("aurealiusUser", userSchema);

passport.use(AurealiusUser.createStrategy());

passport.serializeUser(AurealiusUser.serializeUser());
passport.deserializeUser(AurealiusUser.deserializeUser());

const reportSchema = new mongoose.Schema({
  _reportingUser: {
    type: ObjectId,
    ref: "aurealiusUser"
  },
  _entry: {
    type: ObjectId,
    ref: "entry"
  },
  status: String,
  ruleBroken: String,
  comments: String
}, {
  timestamps: true
});

const Report = new mongoose.model("report", reportSchema);

module.exports = {
  AurealiusUser,
  Entry
};


//-------------------Get Requests-----------------------------------------///

app.get("/index", function(req, res) {

  Entry.find({
      viewStatus: "public",
      reportStatus: "Open"
    })
    .limit(10)
    .sort({
      createdAt: -1
    })
    .populate({
      path: "_user",
      model: "aurealiusUser"
    })
    .exec(function(err, foundEntries) {
      if (err) {
        console.log(err);
      } else {
        if (foundEntries) {
          if (req.isAuthenticated()) {

            let userInfo = req.user;

            let followerArray = JSON.stringify([...new Set(userInfo._followers.map(item => item._id))]);

            AurealiusUser.findOne({
                _id: userInfo._id
              })
              .populate({
                path: "_groupings",
                model: "grouping"
              })
              .populate({
                path: "_following",
                model: "aurealiusUser"
              })
              .populate({
                path: "_followers",
                model: "aurealiusUser"
              })
              .populate({
                path: "_entries",
                model: "entry"
              })
              .exec(function(err, foundUserFollow) {
                if (err) {
                  console.log(err);
                } else {

                  let uniqueGroupings = [...new Set(foundUserFollow._groupings.map(item => item.groupingName))];
                  console.log(uniqueGroupings);

                  res.render("index", {
                    entries: foundEntries,
                    groupings: uniqueGroupings,
                    userData: userInfo,
                    userFollowing: foundUserFollow._following,
                    userFollowers: foundUserFollow._followers
                  });

                }
              });

          }
        }
      }
    });
});

app.get("/index2", function(req, res) {

  if (req.isAuthenticated()) {

    let userInfo = req.user;
    let followerArray = JSON.stringify([...new Set(userInfo._followers.map(item => item._id))]);

    AurealiusUser.findOne({
      _id: userInfo._id
    })
    .populate({
      path: "_following",
      model: "aurealiusUser"
    })
    .populate({
      path: "_groupings",
      model: "grouping"
    })
    .populate({
      path: "_followers",
      model: "aurealiusUser"
    })
    .populate({
      path: "_entries",
      model: "entry"
    })
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {

        let uniqueGroupings = [...new Set(foundUser._groupings.map(item => item.groupingName))];

        res.render("index2", {
          userData: userInfo,
          groupings: uniqueGroupings,
          userFollowing: foundUser._following,
          userFollowers: foundUser._followers
        });

      }
    });
  }

});

app.get("/userEntries", function(req, res) {

  if (req.isAuthenticated()) {

    let userInfo = req.user;

    AurealiusUser.findOne({
      _id: userInfo._id
    })
    .populate({
      path: "_entries",
      match: { reportStatus: "Open"},
      options: {
        populate: {
          path: "_user",
          model: "aurealiusUser"
        },
        populate: {
          path: "_grouping",
          model: "grouping"
        },
        limit: 10,
        sort: {createdAt: -1},
    },
      model: "entry"
    })
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {

        res.render("partials/userEntries", {
          userData: userInfo,
          entries: foundUser._entries
        });
      }
    });
  }

});

app.get("/favoriteEntries", function(req, res) {

  if (req.isAuthenticated()) {

    let userInfo = req.user;

    AurealiusUser.findOne({
      _id: userInfo._id
    })
    .populate({
      path: "_following",
      model: "aurealiusUser"
    })
    .populate({
      path: "_favorites",
      options: {
        populate: {
          path: "_user",
          model: "aurealiusUser"
        },
        limit: 10,
        sort: {createdAt: -1},
      },
      match: {
        reportStatus: "Open"
      },
      model: "entry"
    })
    .exec(function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {

        let filteredFavs = foundUser._favorites.filter(function(result){

          if (result.viewStatus === "private" && JSON.stringify(result._user._id) !== JSON.stringify(foundUser._id)) {
          return false
          }
          return true

        });

        res.render("partials/favoriteEntries", {
          userData: userInfo,
          entries: filteredFavs,
          userFollowing: foundUser._following,
        });
      }
    });
  }

});

app.get("/followingEntries", function(req, res) {

  if (req.isAuthenticated()) {

    let userInfo = req.user;

    AurealiusUser.findOne({
        _id: userInfo._id
      },function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          Entry.find({
            viewStatus: "public",
            reportStatus: "Open",
            _user: {
              $in: foundUser._following
            }
          })
          .limit(10)
          .sort({
            createdAt: -1
          })
          .populate({
            path: "_user",
            model: "aurealiusUser"
          })
          .exec(function(err, foundEntries) {
            if (err) {
              console.log(err);
            } else {

            res.status(200);
            res.render("partials/followingEntries", {
              userData: userInfo,
              entries: foundEntries,
              userFollowing: foundUser._following,
            });
            }
          });
        }
      });
    }

});

app.get("/settings", function(req, res) {

  if (req.isAuthenticated()) {

    AurealiusUser.findOne({
      _id: req.user._id
    }, function(err, userData) {
      if (err) {
        console.log(err);
      } else {
        res.render("settings", {
          userData: userData,
          message: req.flash("success")
        });
      }
    });
  } else {
    res.render("login", {
      error: req.flash("error")
    });
  }
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
    createdAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          let uniqueGroupings = [...new Set(foundEntries.map(item => item.grouping))];

          Grouping.find({
            entries: {
              $all: [{
                $elemMatch: {
                  userId: userIdentifier
                }
              }]
            }
          }).exec(function(err, foundGroupings) {
            if (err) {
              console.log(err);
            } else {
              let uniqueGroupingEntries = [...new Set(foundGroupings.map(item => item.entries))];

              uniqueGroupingEntries.reverse();

              // console.log(uniqueGroupingEntries[1][0].imageFile);

              let groupEntryImages = [];

              if (uniqueGroupingEntries) {
                uniqueGroupingEntries.forEach(function(uGEntry) {
                  groupEntryImages.push(uGEntry[uGEntry.length - 1].imageFile);
                });
              }

              let groupingsArray = [];

              if (uniqueGroupings) {

                uniqueGroupings.forEach(function(cName) {

                  let groupingsObjectData = new Object();
                  groupingsObjectData.name = cName;
                  groupingsObjectData.image = "";

                  groupingsArray.push(groupingsObjectData);
                });

                var i;
                for (i = 0; i < groupingsArray.length; i++) {
                  groupingsArray[i].image = groupEntryImages[i];
                };

              }

              AurealiusUser.findOne({
                _id: userIdentifier
              }, function(err, userData) {
                if (err) {
                  console.log(err);
                } else {
                  res.render("user", {
                    entries: foundEntries,
                    groupingData: groupingsArray,
                    userInfo: userData
                  });
                }
              });
            }
          });
        }
      }
    }
  });
});

app.get("/collections", function(req, res) {

  if (req.isAuthenticated()) {

    AurealiusUser.findOne({
      _id: req.user._id
    })
    .populate({
      path: "_groupingFavorites",
      model: "grouping"
    })
    .exec(function(err, foundUser) {

      Grouping.find({
        _user: mongoose.Types.ObjectId(foundUser._id)
      })
      .populate({
        path: "_user",
        model: "aurealiusUser"
      })
      .populate({
        path: "_entries",
        options: {sort: {createdAt: -1}},
        model: "entry"
      })
      .exec(function(err, foundGroupings) {
        if (err) {
          console.log(err);
        } else {

          let uniqueFavs = [...new Set(foundUser._groupingFavorites.map(item => item.groupingName))];
          // console.log(foundUser._groupingFavorites);

          res.render("collections", {
            userData: foundUser,
            favGroupings: uniqueFavs,
            groupings: foundGroupings
          });
        }
      });
    });
  }

});

app.get("/user/collections/:grouping", function(req, res) {

  let userInfo = req.user;
  let grouping = req.params.grouping.replace("%20", " ");
  // console.log(userInfo._id);
  console.log(grouping);

  if (req.isAuthenticated()) {

    Grouping.findOne({
      groupingName: grouping,
      _user: mongoose.Types.ObjectId(userInfo._id),
    })
    .populate({
      path: "_entries",
      options: {
          populate: {
            path: "_user",
            model: "aurealiusUser"
          },
        limit: 10,
        sort: {createdAt: -1},
      },
      match: {
        reportStatus: "Open"
      },
      model: "entry"
    })
    .exec(function(err, foundGrouping) {

      if(err) {
        console.log(err);
      } else {

        // console.log(foundGrouping._entries);
        res.render("usercollection", {
          groupingInfo: foundGrouping,
          entries: foundGrouping._entries,
          userData: userInfo
        });

      }
    });

  }

});


//--------------------display all files in json-----------------------------//
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

// //--filename specific path, display single file object----------------------//
// app.get("/files/:filename", function(req, res) {
//   gfs.files.findOne({
//     filename: req.params.filename
//   }, function(err, file) {
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: "No File Exist."
//       });
//     } else {
//       //-file exist-//
//       return res.json(file);
//     }
//   })
//
// });

//---------------filename specific path------------------------------------//
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
  res.render("login", {
    error: req.flash("error")
  });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//------------------------POST Requests--------------------------------///

app.post("/register", function(req, res) {

  const registeredFName = req.body.fName;
  const registeredLName = req.body.lName;
  const slicedLName = registeredLName.slice(0, 1);
  const dateNow = Date.now();
  const dateNowString = JSON.stringify(dateNow);
  const timeStamp = dateNowString.substr(dateNowString.length - 4);
  const createdProfileName = registeredFName + slicedLName + timeStamp;

  const emailStngObj = {
    status: "on",
    frequency: "Daily",
    dayOfWeek: "Thursday",
    timeOfDay: "8:30pm",
  };

  AurealiusUser.register({
    email: req.body.email,
    firstName: registeredFName,
    lastName: registeredLName,
    profileName: createdProfileName,
    sessions: 1,
    reminderSettings: emailStngObj,
    bioImageFile: "/assets/defaultusericon.png"
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

app.post("/changePassword", function(req, res) {

  if (req.isAuthenticated()) {

  AurealiusUser.findOne({
      _id: req.user.id
    }, function(err, user) {
      if (err) {
        console.log(err)
      } else {
        user.changePassword(req.body.oldpassword, req.body.newpassword, function(err, success) {
          if (err) {
            console.log(err);
            if (err.name === 'IncorrectPasswordError') {
              res.json({
                success: false,
                message: 'Current password incorrect! Please try again.'
              });
            } else {
              res.json({
                success: false,
                message: 'Something went wrong! Please try again.'
              });
            }
          } else {
            console.log("User successfully updated password.")
            res.json({
              success: true,
              message: 'Your password has been changed successfully!'
            });
          }
        });
      }
    });
  }

});

app.post("/", function(req, res) {

  const user = new AurealiusUser({
    email: req.body.email,
    password: req.body.password,
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

app.post("/login", passport.authenticate("local", {
  successRedirect: "/index",
  failureRedirect: "/login",
  failureFlash: {
    type: "error",
    message: "Uh oh! Invalid username or password. Please try again."
  }
}));

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
      let mm = String(today.getMonth());
      let yyyy = today.getFullYear();

      const month = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug",
        "Sept", "Oct", "Nov", "Dec"
      ]

      today = month[mm] + " " + dd + ", " + yyyy;
      return today;
    } else {
      return userCollectionChoice;
    }
  }

  const currentUser = req.user.id;
  const currentUserProfile = req.user.profileName;

  function statusAssignment() {
    const pubPri = req.body.status;

    if (pubPri === "private") {
      return pubPri;
    } else {
      let entryStatus = "public";
      return entryStatus;
    }
  }

  const newEntry = new Entry({
    imageFile: fileExists(),
    caption: req.body.caption,
    _user: mongoose.Types.ObjectId(currentUser),
    viewStatus: statusAssignment(),
    reportStatus: "Open",
  });

  newEntry.save();

  AurealiusUser.update({
    _id: currentUser
  }, {
    $push: {
      _entries: mongoose.Types.ObjectId(newEntry._id)
    }
  }, function(err, success) {
    if (err) {
      console.log(err);
    } else {
      Grouping.find({
        _user: mongoose.Types.ObjectId(currentUser)
      }).exec(function(err, foundGroupings) {
        if (err) {
          console.log(err);
        } else {

          let uniqueGroupings = [...new Set(foundGroupings.map(item => item.groupingName))];

          if(!uniqueGroupings.includes(collectionAllocator())) {

            const newGrouping = new Grouping({
              groupingName: collectionAllocator(),
              groupingImageFile: fileExists(),
              _user: mongoose.Types.ObjectId(currentUser),
              _entries: [mongoose.Types.ObjectId(newEntry._id)],
              viewStatus: statusAssignment()
            });

            newGrouping.save();
            console.log("New grouping successfully added to Grouping Collection.");

            AurealiusUser.update({
              _id: currentUser
            }, {
              $push: {
                _groupings: mongoose.Types.ObjectId(newGrouping._id)
              }
            }, function(err, success) {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully added grouping to aurealiusUsers.");
              }
            });

            Entry.update({
              _id: newEntry._id
            }, {
              $push: {
                _grouping: mongoose.Types.ObjectId(newGrouping._id)
              }
            }, function(err, success) {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully added groupId to entry.");
              }
            });

          } else {
            if (fileExists() != "NOTHING TO SEE HERE") {

              Grouping.findOneAndUpdate({
                groupingName: collectionAllocator(),
                _user: mongoose.Types.ObjectId(currentUser),
              },{
                $set: {
                  groupingImageFile: fileExists()
                },
                $push: {
                  _entries: mongoose.Types.ObjectId(newEntry._id)
                }
              }, function(err, updatedGrouping){
                console.log("New entry added to existing Grouping.");
                console.log("Grouping image successfully updated.");

                Entry.update({
                  _id: newEntry._id
                }, {
                  $push: {
                    _grouping: mongoose.Types.ObjectId(updatedGrouping._id)
                  }
                }, function(err, success) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Successfully added groupId to entry.");
                  }
                });
              });

            } else {

              Grouping.findOneAndUpdate({
                groupingName: collectionAllocator(),
                _user: mongoose.Types.ObjectId(currentUser),
              },{
                $push: {
                  _entries: mongoose.Types.ObjectId(newEntry._id)
                }
              }, function(err, updatedGrouping){
                console.log("New entry added to existing Grouping.");

                Entry.update({
                  _id: newEntry._id
                }, {
                  $push: {
                    _grouping: mongoose.Types.ObjectId(updatedGrouping._id)
                  }
                }, function(err, success) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Successfully added groupId to entry.");
                  }
                });
              });
            }
          }
        }
      });
    }
  });

  res.redirect("back");

});

app.post("/userImageUpload", upload.single("file"), function(req, res) {

  function userFileExists() {
    if (typeof req.file === "undefined") {
      let userfileName = "";
      return userfileName
    } else {
      let userfileName = req.file.filename;
      return userfileName
    }
  }

  AurealiusUser.updateOne({
    _id: req.user.id
  }, {bioImageFile: userFileExists()}, function(err, success) {
    if (err) {
      console.log(err)
    } else {
      console.log("Succesfully updated userBioImage.")
    }
  });

  res.status(200);
  res.end(userFileExists());

});

app.post("/collectionNameUpdate", function(req, res) {

  let collectionId = req.body._id;
  let newCltName = req.body.groupingName;

  Grouping.findOne({
    _id: collectionId,
  }, function(err, foundGrouping) {

    if(JSON.stringify(foundGrouping._user) === JSON.stringify(req.user.id)) {

      Grouping.updateOne({
        _id: collectionId,
      },{
        $set: {
          groupingName:  newCltName
        }
      },{
        new: true
      }, function(err, success) {
        if (err) {
          console.log(err)
        } else {
          console.log("Succesfully updated groupingName.");
          res.status(200);
          res.end();
        }
      });

    } else {

      console.log("Invalid user request.")
      res.status(200);
      res.end("Invalid user!");

    }

  });

});


app.post("/userEMSttings", function(req, res) {

  let emailSettingsDataObj = req.body;
  console.log(emailSettingsDataObj);

  AurealiusUser.findOneAndUpdate({
    _id: req.user.id
  }, {
    $set: {
      reminderSettings:  emailSettingsDataObj
    }
  },{
    new: true
  }, function(err, success) {
    if (err) {
      console.log(err)
    } else {
      console.log("Succesfully updated email reminder settings.");
      res.status(200);
      res.end();
    }
  });

});

app.post("/userSettingsUpload", function(req, res) {

  let uploadFieldOjb = req.body.data;

  if (uploadFieldOjb.hasOwnProperty("email")) {

    AurealiusUser.findOne({ email: uploadFieldOjb.email}, function(err, foundUser) {

      if (foundUser) {
        res.end("Uh Oh! It looks like that email is already taken. Please try another.");

      } else {

        AurealiusUser.updateOne({
          _id: req.user.id
        }, uploadFieldOjb, function(err, success) {
          if (err) {
            console.log(err)
          } else {
            console.log("Succesfully updated user settings.");
            res.status(200);
            res.end();
          }
        });
      }
    });
  } else {

    AurealiusUser.updateOne({
      _id: req.user.id
    }, uploadFieldOjb, function(err, success) {
      if (err) {
        console.log(err)
      } else {
        console.log("Succesfully updated user settings.");
        res.status(200);
        res.end()
      }
    });
  }

});

app.post("/moreEEntries", function(req, res) {

  let seenEntryIds = req.body.totalSeenIds;
  // console.log(typeof seenEntryIds);
  // console.log(seenEntryIds);

  Entry.find({
      viewStatus: "public",
      reportStatus: "Open",
      _id: {
        $nin: seenEntryIds
      }
    })
    .limit(10)
    .sort({
      createdAt: -1
    })
    .populate({
      path: "_user",
      model: "aurealiusUser"
    })
    .exec(function(err, foundEntries) {
      if (err) {
        console.log(err);
      } else {
        if (foundEntries) {
          if (req.isAuthenticated()) {

            let userInfo = req.user;

            let followerArray = JSON.stringify([...new Set(userInfo._followers.map(item => item._id))]);
            // let uniqueGroupings = [...new Set(foundEntries.map(item => item.grouping))];

            AurealiusUser.findOne({
                _id: req.user.id
              })
              .populate({
                path: "_following",
                model: "aurealiusUser"
              })
              .populate({
                path: "_followers",
                model: "aurealiusUser"
              })
              .exec(function(err, foundUserFollow) {
                if (err) {
                  console.log(err);
                } else {

                  res.status(200);
                  res.render("partials/everyoneEntries", {
                    entries: foundEntries,
                    // groupings: uniqueGroupings,
                    userData: userInfo,
                    userFollowing: foundUserFollow._following,
                    userFollowers: foundUserFollow._followers
                  });
                }
              });

          }
        }
      }
    });
});

app.post("/follow", function(req, res) {

  const poster = req.user.id;
  const followTargetId = req.body.flwBtnUserId;

  AurealiusUser.findOne({
      _id: poster
    })
    .populate({
      path: "_following",
      model: "aurealiusUser"
    })
    .populate({
      path: "_followers",
      model: "aurealiusUser"
    })
    .exec(function(err, foundPoster) {
      if (err) {
        console.log(err);
      } else {

        let posterFollowingArray = JSON.stringify([...new Set(foundPoster._following.map(item => item._id))]);
        let posterFollowerArray = JSON.stringify([...new Set(foundPoster._followers.map(item => item._id))]);

        AurealiusUser.findOne({
            _id: followTargetId
          })
          .populate({
            path: "_following",
            model: "aurealiusUser"
          })
          .populate({
            path: "_followers",
            model: "aurealiusUser"
          })
          .exec(function(err, foundTarget) {
            if (err) {
              console.log(err);
            } else {

              let targetFollowerArray = JSON.stringify([...new Set(foundTarget._followers.map(item => item._id))]);

              if (posterFollowingArray.includes(foundTarget._id) === false) {
                AurealiusUser.findOneAndUpdate({
                    _id: foundPoster._id
                  }, {
                    $push: {
                      _following: mongoose.Types.ObjectId(foundTarget._id)
                    }
                  }, {
                    new: true
                  }).populate({
                    path: "_following",
                    model: "aurealiusUser"
                  })
                  .populate({
                    path: "_followers",
                    model: "aurealiusUser"
                  })
                  .exec(function(err, updatedPoster) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("Successfully added user " + foundTarget._id + " to following.");

                      AurealiusUser.updateOne({
                          _id: foundTarget._id
                        }, {
                          $push: {
                            _followers: mongoose.Types.ObjectId(foundPoster._id)
                          }
                        })
                        .populate({
                          path: "_following",
                          model: "aurealiusUser"
                        })
                        .populate({
                          path: "_followers",
                          model: "aurealiusUser"
                        })
                        .exec(function(err, success) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Successfully added user " + foundPoster._id + " to followers.")
                          }
                        });
                      res.status(200);
                      res.render('partials/followPanel', {
                        userData: updatedPoster,
                        userFollowing: updatedPoster._following,
                        userFollowers: updatedPoster._followers
                      });
                    }

                  });

              } else {

                AurealiusUser.updateOne({
                    _id: foundTarget._id
                  }, {
                    $pull: {
                      _followers: mongoose.Types.ObjectId(foundPoster._id)
                    }
                  })
                  .populate({
                    path: "_following",
                    model: "aurealiusUser"
                  })
                  .populate({
                    path: "_followers",
                    model: "aurealiusUser"
                  })
                  .exec(function(err, success) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("Successfully removed user " + foundPoster._id + " from followers.");

                      AurealiusUser.findOneAndUpdate({
                          _id: foundPoster._id
                        }, {
                          $pullAll: {
                            _following: [mongoose.Types.ObjectId(foundTarget._id)]
                          }
                        }, {
                          new: true
                        }).populate({
                          path: "_following",
                          model: "aurealiusUser"
                        })
                        .populate({
                          path: "_followers",
                          model: "aurealiusUser"
                        })
                        .exec(function(err, updatedPoster) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Successfully removed user " + foundTarget._id + " from following.")
                            res.status(200);
                            res.render('partials/followPanel', {
                              userData: updatedPoster,
                              userFollowing: updatedPoster._following,
                              userFollowers: updatedPoster._followers
                            });
                          }
                        });
                    }
                  });

              }

            }

          });
      }
    });

});

app.post("/updateEPrivacy", function(req, res) {

  let entryId = req.body.entryId;
  // console.log(entryId);
  let viewStatus = req.body.viewStatus;
  // console.log(viewStatus);

  AurealiusUser.findOne({_id: req.user.id}, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {
      Entry.findOne({
        _id: entryId
      })
      .populate({
        path: "_user",
        model: "aurealiusUser"
      })
      .exec(function(err, foundEntry) {
        if (err) {
          console.log(err);
        } else {

          if(JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user._id)) {

            Entry.updateOne({
              _id: entryId,
            }, {
              $set: {
                viewStatus: viewStatus
              }
            }, function(err, success) {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully updated entry privacy.");
                res.status(200);
                res.end();
              }
            });

          } else {
            res.status(200);
            res.end("Invalid User!");
          }
        }
      });
    }

  });

});

app.post("/updateCltPrivacy", function(req, res) {

  let collectionId = req.body.collectionId;
  let viewStatus = req.body.viewStatus;

  AurealiusUser.findOne({_id: req.user.id}, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {
      Grouping.findOne({
        _id: collectionId
      })
      .populate({
        path: "_user",
        model: "aurealiusUser"
      })
      .exec(function(err, foundCollection) {
        if (err) {
          console.log(err);
        } else {

          if(JSON.stringify(foundUser._id) === JSON.stringify(foundCollection._user._id)) {

            Grouping.updateOne({
              _id: collectionId,
            }, {
              $set: {
                viewStatus: viewStatus
              }
            }, function(err, success) {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully updated collection privacy.");
                res.status(200);
                res.end();
              }
            });

          } else {
            res.status(200);
            res.end("Invalid User!");
          }
        }
      });
    }

  });

});

app.post("/update", function(req, res) {

  AurealiusUser.findOne({_id: req.user.id}, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {
      Entry.findOne({_id: req.body._id}, function(err, foundEntry) {
        if (err) {
          console.log(err);
        } else {

          if(JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user._id)) {

            Entry.updateOne({
              _id: req.body._id,
            }, {
              $set: {
                caption: req.body.caption
              }
            }, function(err, success) {
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully updated entry caption.");
                res.status(200);
                res.end();
              }
            });

          } else {
            res.status(200);
            res.end("Invalid User!");
          }
        }
      });
    }

  });

});

app.post("/favorite", function(req, res) {

  Entry.findOne({
    _id: req.body._id
  }, function(err, foundEntry) {

    AurealiusUser.findOne({
      _id: req.user.id
    }, function(err, foundUser) {
      if (err) {
        console.log(err)
      } else {

        let userfavoritesArray = JSON.stringify(foundUser._favorites);

        if (userfavoritesArray.includes(foundEntry._id)) {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $pullAll: {
              _favorites: [mongoose.Types.ObjectId(foundEntry._id)]
            }
          }, {
            new: true
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully removed entry from user's favorites.");
            }
          });
        } else {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $push: {
              _favorites: mongoose.Types.ObjectId(foundEntry._id)
            }
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully added entry from user's favorites.");
            }
          });
        }

        let entryFavoritesArray = JSON.stringify(foundEntry._favoriteUsers);

        if (entryFavoritesArray.includes(foundUser._id)) {
          Entry.updateOne({
            _id: req.body._id
          }, {
            $pullAll: {
              _favoriteUsers: [mongoose.Types.ObjectId(req.user.id)]
            }
          }, {
            new: true
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully removed user from entry favorites.");
            }
          });
        } else {
          Entry.updateOne({
            _id: req.body._id
          }, {
            $push: {
              _favoriteUsers: mongoose.Types.ObjectId(req.user.id)
            }
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully added user to entry favorites.");
            }
          });
        }
      }
    });
  });

  res.status(200);
  res.end();

});

app.post("/favoriteGrouping", function(req, res) {

  Grouping.findOne({
    _id: req.body._id
  }, function(err, foundGrouping) {

    AurealiusUser.findOne({
      _id: req.user.id
    }, function(err, foundUser) {
      if (err) {
        console.log(err)
      } else {

        let userfavoritesArray = JSON.stringify(foundUser._groupingFavorites);

        if (userfavoritesArray.includes(foundGrouping._id)) {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $pullAll: {
              _groupingFavorites: [mongoose.Types.ObjectId(foundGrouping._id)]
            }
          }, {
            new: true
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully removed grouping from user's favorite groupings.");
            }
          });
        } else {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $push: {
              _groupingFavorites: mongoose.Types.ObjectId(foundGrouping._id)
            }
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully added grouping to user's favorite groupings.");
              res.status(200);
              res.end();
            }
          });
        }
      }
    });
  });
});

app.post("/report", function(req, res) {

  let reportedEntryId = req.body.entryId;
  let ruleBroken = req.body.ruleBroken;
  let comments = req.body.comments;

  Entry.findOne({
    _id: reportedEntryId
  }, function(err, foundEntry) {
    if (err) {
      console.log(err);
    } else {
      Entry.updateOne({
        _id: reportedEntryId
      }, {
        reportStatus: "Pending"
      }, function(err, success) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully reported entry.");

          AurealiusUser.findOne({
              _id: req.user.id
            },
            function(err, foundUser) {
              if (err) {
                console.log(err);
              } else {

                function reportTracker() {
                  if (foundUser.reports === undefined) {
                    let reportings = 0;
                    let updatedReportings = ++reportings;
                    return updatedReportings;
                  } else {
                    let reportings = foundUser.reports;
                    let updatedReportings = ++reportings
                    return updatedReportings;
                  }
                }

                AurealiusUser.updateOne({
                  _id: req.user.id
                }, {
                  reports: reportTracker()
                }, function(err, success) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Successfully updated number of reportings.");

                    const newReport = new Report({
                      _reportingUser: mongoose.Types.ObjectId(foundUser._id),
                      _entry: mongoose.Types.ObjectId(foundEntry._id),
                      status: "Pending",
                      ruleBroken: ruleBroken,
                      comments: comments
                    });
                    newReport.save();
                    console.log("Successfully added new reporting.");

                    res.status(200);
                    res.end();
                  }
                });
              }
            });
        }
      });

    }
  });

});

app.post("/delete", function(req, res) {

  let deleteBtnEntryId = req.body.entryId;
  console.log(deleteBtnEntryId);
  let deleteBtnimageFile = req.body.fileName;
  // console.log(deleteBtnimageFile);

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {

      Entry.findOne({_id: deleteBtnEntryId}, function(err, foundEntry) {
        if (err) {
          console.log(err);
        } else {

          if(JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user)) {

            AurealiusUser.findOneAndUpdate({
              _id: req.user.id
            }, {
              $pullAll: {
                _entries: [mongoose.Types.ObjectId(deleteBtnEntryId)]
              }
            }, {
              new: true
            }, function(err, success) {

              console.log("Successfully removed entry from user entries.");

              Entry.deleteOne({
                _id: deleteBtnEntryId
              }, function(err, success) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Successfully deleted entry.");

                  gfs.remove({
                    filename: deleteBtnimageFile,
                    root: "uploads"
                  }, function(err, success) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("Successfully deleted entry upload.")
                      res.status(200);
                      res.end();
                    }
                  });
                }
              });
            });

          } else {
            res.status(200);
            res.end("Invalid User!");
          }
        }
      });
    }

  });

});

app.post("/deleteCollection", function(req, res) {

  let collectionId = req.body.deleteCollectionButton;

  if (req.isAuthenticated()) {

    Grouping.findOne({
      _id: collectionId,
    })
    .populate({
      path: "_entries",
      model: "entry"
    }).exec(function(err, foundGrouping) {

      if(JSON.stringify(foundGrouping._user) === JSON.stringify(req.user.id)) {

        groupingEntriesObjArray = [];

        let groupingEntryIds = [...new Set(foundGrouping._entries.map(item => item._id))];
        let groupingImageFileArray = [...new Set(foundGrouping._entries.map(item => item.imageFile))];

        console.log(groupingEntryIds);
        console.log(groupingImageFileArray);


        groupingEntryIds.forEach(function(entryId) {

          let newObjId = mongoose.Types.ObjectId(entryId);

          groupingEntriesObjArray.push(newObjId);

        });

        // console.log(foundGrouping._entries);
        // console.log(groupingEntriesObjArray);

        if(!groupingImageFileArray.includes(foundGrouping.groupingImageFile)) {
          groupingImageFileArray.push(foundGrouping.groupingImageFile);
        }

        // console.log(groupingImageFileArray);

        AurealiusUser.findOneAndUpdate({
          _id: req.user.id
        }, {
          $pull: {
            _groupings: mongoose.Types.ObjectId(foundGrouping._id),
            _groupingFavorites: mongoose.Types.ObjectId(foundGrouping._id),
          },
          $pullAll: {
            _entries: groupingEntriesObjArray
          }
        }, function(err, updatedUser){

          console.log("Succesfully updated users entries and Grouping.");

          Grouping.deleteOne({
            _id: collectionId,
          }, function(err, success) {
            if (err) {
              console.log(err)
            } else {
              console.log("Succesfully deleted Grouping.");

              Entry.deleteMany({
                _grouping: mongoose.Types.ObjectId(collectionId)
              }, function(err, success){
                console.log("Succesfully deleted all entries from grouping.");
                // console.log(foundGrouping.groupingImageFile);

                gfs.remove({
                  // filename: foundGrouping.groupingImageFile,
                  filename: groupingImageFileArray,
                  root: "uploads"
                }, function(err, success) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Successfully removed groupingImageFile from uploads directory.");
                    res.redirect("back");
                  }
                });
              });
            }
          });
        });

      } else {

      console.log("Invalid user request.");
      res.status(200);
      res.end("Invalid user!");

      }

    });

  }

});

//-----------------------------------SERVER----------------------------------///

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
