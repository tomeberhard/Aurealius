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

//-----------------------Middleware-----------------------------------//
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

//-------------------Create Mongo Connection--------------------------//
mongoose.connect("mongodb://localhost:27017/aurealiusUsersDB", {
  useNewUrlParser: true
});
// //below just to kill depracation warning//
mongoose.set('useCreateIndex', true);

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
const entrySchema = new mongoose.Schema({
  imageFile: String,
  caption: String,
  grouping: String,
  userId: String,
  // profileName: [userSchema],
  userProfile: String,
  favoriteUsers: Array,
  viewStatus: String,
  reportStatus: String
}, {
  timestamps: true
});

const Entry = new mongoose.model("entry", entrySchema);

const userSchema = new mongoose.Schema({
  userName: String,
  profileName: String,
  firstName: String,
  lastName: String,
  bioImageFile: String,
  googleId: String,
  facebookId: String,
  entries: [entrySchema],
  favorites: [entrySchema],
  followers: Array,
  following: Array,
  reports: Number
}, {
  timestamps: true
});

userSchema.plugin(passportLocalMongoose);

const AurealiusUser = new mongoose.model("aurealiusUser", userSchema);

passport.use(AurealiusUser.createStrategy());

passport.serializeUser(AurealiusUser.serializeUser());
passport.deserializeUser(AurealiusUser.deserializeUser());

const groupSchema = new mongoose.Schema({
  name: String,
  entries: [entrySchema],
  userId: String
}, {
  timestamps: true
});

const Grouping = new mongoose.model("grouping", groupSchema);

const reportSchema = new mongoose.Schema({
  reportingId: String,
  entryId: String,
  status: String,
  ruleBroken: String,
  comments: String
}, {
  timestamps: true
});

const Report = new mongoose.model("report", reportSchema);


//-------------------Get Requests-----------------------------------------///

app.get("/index", function(req, res) {

  Entry.find({
    viewStatus: "public",
    reportStatus: "Open"
  }).sort({
    createdAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          let userInfo = req.user;
          let identifier = JSON.stringify(userInfo._id).replace(/"/g, "");

          Grouping.find({
            entries: {
              $all: [{
                $elemMatch: {
                  userId: identifier
                }
              }]
            }
          }).exec(function(err, foundGroupings) {
            if (err) {
              console.log(err);
            } else {

              let uniqueGroupings = [...new Set(foundGroupings.map(item => item.name))];

              res.render("index", {
                entries: foundEntries,
                groupings: uniqueGroupings,
                userData: userInfo
              });
            }
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

app.get("/user/:currentUserId/collections/:grouping", function(req, res) {

  const userIdentifier = req.params.currentUserId;
  const grouping = req.params.grouping;

  //---Render the entries--//
  Entry.find({
    userId: userIdentifier,
    grouping: grouping
  }).sort({
    createdAt: -1
  }).exec(function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {
      if (foundEntries) {
        if (req.isAuthenticated()) {

          AurealiusUser.find({
            _id: userIdentifier
          }, function(err, userData) {
            if (err) {
              console.log(err);
            } else {
              res.render("usercollection", {
                entries: foundEntries,
                userInfo: userData
              });
            }
          });
        }
      }
    }
  });
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

//--filename specific path, display single file object----------------------//
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
  res.render("login");
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
  const timeStamp = JSON.stringify(dateNow).slice(0, 4);
  const createdProfileName = registeredFName + slicedLName + timeStamp;

  AurealiusUser.register({
    username: req.body.username,
    firstName: registeredFName,
    lastName: registeredLName,
    profileName: createdProfileName,
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

app.post("/", function(req, res) {

  const user = new AurealiusUser({
    username: req.body.username,
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

app.post("/login", function(req, res) {

  const user = new AurealiusUser({
    username: req.body.username,
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
    grouping: collectionAllocator(),
    userId: currentUser,
    userProfile: currentUserProfile,
    viewStatus: statusAssignment(),
    reportStatus: "Open"
  });

  Grouping.find({
    name: collectionAllocator()
    // userId: currentUser
  }, function(err, groupingNames) {
    if (err) {
      consoloe.log(err);
    } else {
      if (groupingNames != "") {
        Grouping.update({
          name: collectionAllocator()
          // userId: currentUser
        }, {
          $push: {
            entries: newEntry
          }
        }, function(err, success) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added entry to existing grouping.");
          }
        });
      } else {
        const newGrouping = new Grouping({
          name: collectionAllocator(),
          entries: newEntry
          // userId: currentUser
        });
        newGrouping.save();
      }
    }
  });

  AurealiusUser.update({
    _id: currentUser
  }, {
    $push: {
      entries: newEntry
    }
  }, function(err, success) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully added entry to aurealiusUsersDB.");
    }
  });
  newEntry.save();
  res.redirect("back");
});

app.post("/userUpload", upload.single("file"), function(req, res) {

  function userFileExists() {
    if (typeof req.file === "undefined") {
      let userfileName = "";
      return userfileName
    } else {
      let userfileName = req.file.filename;
      return userfileName
    }
  }

  const newImgFile = userFileExists();
  const currentUId = req.body.userProfileName;
  const currentUserFirstName = req.body.userFName;
  const currentUserLastName = req.body.userLName;

  AurealiusUser.find({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (newImgFile === "") {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            bioImageFile: foundUser[0].bioImageFile
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Kept existing user profile picture.");
            }
          }
        );
      } else {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            bioImageFile: newImgFile
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully updated profile picture.");
            }
          }
        );
      }
    }
  });

  AurealiusUser.find({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (currentUId === "") {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            profileName: foundUser[0].profileName
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Kept existing user profile name.");
            }
          }
        );
      } else {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            profileName: currentUId
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully updated profile name.");
            }
          }
        );
      }
    }
  });

  AurealiusUser.find({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (currentUserFirstName === "") {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            firstName: foundUser[0].firstName
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Kept existing user first name.");
            }
          }
        );
      } else {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            firstName: currentUserFirstName
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully updated user first name.");
            }
          }
        );
      }
    }
  });

  AurealiusUser.find({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (currentUserFirstName === "") {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            lastName: foundUser[0].lastName
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Kept existing user last name.");
            }
          }
        );
      } else {
        AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            lastName: currentUserLastName
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully updated user last name.");
            }
          }
        );
      }
    }
  });

  res.redirect("user");

});

app.post("/follow", function(req, res) {

  const fllw = req.body.followButton;

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {

      if (foundUser.following.includes(fllw) === false) {
        AurealiusUser.updateOne({
          _id: req.user.id
        }, {
          $push: {
            following: fllw
          }
        }, function(err, success) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added user to following.")
          }
        });
      } else {
        AurealiusUser.updateOne({
          _id: req.user.id
        }, {
          $pull: {
            following: fllw
          }
        }, function(err, success) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully removed user from following.")
          }
        });
      }
    }
  });

  AurealiusUser.findOne({
    _id: fllw
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser.followers.includes(req.user.id) === false) {
        AurealiusUser.updateOne({
          _id: fllw
        }, {
          $push: {
            followers: req.user.id
          }
        }, function(err, success) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added user to followers.")
          }
        });
      } else {
        AurealiusUser.updateOne({
          _id: fllw
        }, {
          $pull: {
            followers: req.user.id
          }
        }, function(err, success) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully removed user from followers.")
          }
        });
      }
    }
  });

  res.redirect("back");

});


app.post("/favorite", function(req, res) {

  Entry.find({
    _id: req.body.favoriteButton
  }, function(err, foundEntry) {

    AurealiusUser.find({
      _id: req.user.id,
      favorites: {
        $elemMatch: {
          _id: foundEntry[0]._id
        }
      }
    }, function(err, userWfav) {
      if (err) {
        console.log(err);
      } else {
        if (userWfav.length != 0) {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $pull: {
              favorites: {
                _id: foundEntry[0]._id
              }
            }
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully removed entry from favorites.")
            }
          });
        } else {
          AurealiusUser.updateOne({
            _id: req.user.id
          }, {
            $push: {
              favorites: foundEntry
            }
          }, function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully added entry to favorites.")
            }
          });
        }
      }
    });
  });

  Entry.findOne({
    _id: req.body.favoriteButton,
    favoriteUsers: {
      $all: [req.user.id]
    },
  }, function(err, foundFavUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundFavUser) {
        Entry.updateOne({
            _id: req.body.favoriteButton
          }, {
            $pull: {
              favoriteUsers: req.user.id
            }
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully unfavorited entry.");
            }
          }
        );
      } else {
        Entry.updateOne({
            _id: req.body.favoriteButton
          }, {
            $push: {
              favoriteUsers: req.user.id
            }
          },
          function(err, success) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully favorited entry.");
            }
          }
        );
      }
    }
  });

  res.redirect("back");

});

app.post("/report", function(req, res) {

  Entry.find({
    _id: req.body.reportButton
  }, function(err, foundEntry) {
    if (err) {
      console.log(err);
    } else {
      Entry.updateOne({
        _id: req.body.reportButton
      }, {
        reportStatus: "Pending"
      }, function(err, success) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully reported entry.");
        }
      });

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
              }
            });

            const newReport = new Report({
              reportingId: foundUser._id,
              entryId: foundEntry[0]._id,
              status: "Pending",
              ruleBroken: req.body.rule,
              comments: req.body.reportComments
            });
            newReport.save();
            console.log("Successfully added new reporting.")
          }
        });
    }
  });

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

app.post("/deleteCollection", function(req, res) {

  Entry.find({
    userId: req.user.id,
    grouping: req.body.deleteCollectionButton
  }, function(err, foundEntries) {
    if (err) {
      console.log(err);
    } else {

      let groupingImageFiles = [...new Set(foundEntries.map(item => item.imageFile))];

      var i;
      for (i = 0; i < groupingImageFiles.length; i++) {
        gfs.remove({
          filename: groupingImageFiles[i],
          root: "uploads"
        }, function(err) {
          if (err) {
            return res.status(404).json({
              err: err
            });
          } else {
            console.log("Successfully deleted grouping image file.")
          }
        });
      }
    }
  });

  Entry.deleteMany({
    userId: req.user.id,
    grouping: req.body.deleteCollectionButton
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully deleted all entries in grouping.");
    }
  });

  //---NEED TO FIGURE OUT THE GROUPING DELETE MECHANISM-----------------------//
  // Grouping.deleteMany({userId: req.user.Id,
  //   grouping: req.body.deleteCollectionButton
  // }, function(err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log("Successfully deleted all entries in group.");
  //   }
  // });

  res.redirect("user");

});

app.post("/chosenCollection", function(req, res) {

  const collectionChosen = req.body.userCollectionChosen;

  if (req.isAuthenticated()) {
    const currentUserId = req.user._id;

    res.redirect("/user/" + currentUserId + "/collections/" + collectionChosen);
  }

});

//---SERVER---///

let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
