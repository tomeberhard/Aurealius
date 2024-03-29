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

const http = require("http");
const url = require("url");

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

const mongoURI = "mongodb://localhost:27017/aurealiusUsersDB";

// mongoose.connect("mongodb+srv://admin-scott:isaweneskanter@aurealius-7vtw9.mongodb.net/aurealiusUsersDB", {
//   useNewUrlParser: true
// });

const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

mongoose.connect(mongoURI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
});


// mongoose.connect(, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
//below just to kill depracation warning//

// mongoose.set('useCreateIndex', true);
//kills error from findOneandUpdate//
// mongoose.set('useFindAndModify', false);
// mongoose.set('useUnifiedTopology', true);

// const conn = mongoose.createConnection(mongoURI);


//--------------------Init GridFs--------------------------------------//
let gfs;

conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
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

const launchContactSchema = new mongoose.Schema({
  email: String
}, {
  timestamps: true
});

const LaunchContact = new mongoose.model("launchContact", launchContactSchema);

const launchContactUsFormSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  contactRationale: String,
  lContactContent: String
}, {
  timestamps: true
});

const LaunchContactUsForm = new mongoose.model("launchContactUsForm", launchContactUsFormSchema);

const entrySchema = new mongoose.Schema({
  imageFile: String,
  caption: String,
  _grouping: {
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

entrySchema.index({
  caption: "text"
});

const Entry = new mongoose.model("entry", entrySchema);

const groupingSchema = new mongoose.Schema({
  groupingName: String,
  groupingImageFile: String,
  userDesignatedImage: Boolean,
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

groupingSchema.index({
  groupingName: "text",
});

const Grouping = new mongoose.model("grouping", groupingSchema);

const hashGroupingSchema = new mongoose.Schema({
  groupingName: String,
  groupingImageFile: String,
  foundingUser: {
    type: ObjectId,
    ref: "aurealiusUser"
  },
  _users: [{
    type: ObjectId,
    ref: "aurealiusUser"
  }],
  _entries: [{
    type: ObjectId,
    ref: "entry"
  }],
}, {
  timestamps: true
});

hashGroupingSchema.index({
  groupingName: "text",
});

const Hashgrouping = new mongoose.model("hashGrouping", hashGroupingSchema);

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

userSchema.index({
  profileName: "text",
  firstName: "text",
  lastName: "text"
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

app.get("/Everyone", function(req, res) {

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

                  let uniqueGroupings2 = [...new Set(foundUserFollow._groupings)];

                  res.render("everyone", {
                    entries: foundEntries,
                    groupings: uniqueGroupings2,
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

app.post("/newEntryGroupingOptions", function(req, res) {

  let userId = req.user.id;
  let viewStatusData = req.body.viewStatusData

  let privacyQueryParameter = new Object();
  privacyQueryParameter._user = mongoose.Types.ObjectId(userId);

  if (viewStatusData === "public") {
    privacyQueryParameter.viewStatus = "public";
  }

  if (req.isAuthenticated()) {

    Grouping.find(
        privacyQueryParameter
      ).sort({
        updatedAt: -1
      })
      .exec(function(err, foundGroupings) {

        if (err) {
          console.log(err);
        } else {

          res.render("partials/newEntryCollections", {
            groupings: foundGroupings
          })

        }

      });

  }

});

app.post("/searchResults", function(req, res) {

  let searchResultData = req.body.data;
  console.log(searchResultData);

  let searchQuery = new RegExp(searchResultData, "i")

  if (req.isAuthenticated()) {

    if(searchResultData != "") {

      AurealiusUser.find().or([{
          "profileName": {
            $regex: searchQuery,
          }
        },
          {
            "firstName": {
              $regex: searchQuery,
          }
        },
        {
          "lastName": {
            $regex: searchQuery,
        }
      }
    ]).exec(function(err, foundUsers) {

        if (err) {
          console.log(err);
        } else {

          Entry.find({
            $text: {
              $search : searchResultData
            },
            viewStatus: "public",
          })
           .populate({
             path: "_user",
             model: "aurealiusUser"
           }).exec(function(err, foundEntries) {

              if (err) {
                console.log(err);
              } else {

              Grouping.find({
                $text: {
                  $search : searchResultData
                },
                viewStatus: "public",
              }).populate({
                 path: "_user",
                 model: "aurealiusUser"
               }).exec(function(err, foundGroupings) {

                  if (err) {
                    console.log(err);
                  } else {

                    res.render("partials/searchResults", {
                      users: foundUsers,
                      entries: foundEntries,
                      groupings: foundGroupings
                    });
                  }
                });
              }
            });
          }
      });
    }
  }
});


app.get("/Yours", function(req, res) {

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

          res.render("yourGratitude", {
            userData: userInfo,
            groupings: uniqueGroupings,
            userFollowing: foundUser._following,
            userFollowers: foundUser._followers
          });

        }
      });
  }

});

app.get("/user/:publicUserName", function(req, res) {

  if (req.isAuthenticated()) {

    let userName = req.params.publicUserName;
    let requestingUser = req.user;

    AurealiusUser.findOne({
        profileName: userName
      })
      .populate({
        path: "_following",
        model: "aurealiusUser"
      })
      .populate({
        path: "_groupings",
        match: {
          viewStatus: "public"
        },
        model: "grouping"
      })
      .populate({
        path: "_followers",
        model: "aurealiusUser"
      })
      .populate({
        path: "_entries",
        match: {
          reportStatus: "Open",
          viewStatus: "public"
        },
        model: "entry"
      })
      .exec(function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          let uniqueGroupings = [...new Set(foundUser._groupings.map(item => item.groupingName))];

          res.render("theirGratitude", {
            userData: foundUser,
            requestingUser: requestingUser,
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
    let followerArray = JSON.stringify([...new Set(userInfo._followers.map(item => item._id))]);

    AurealiusUser.findOne({
        _id: userInfo._id
      })
      .populate({
        path: "_entries",
        match: {
          reportStatus: "Open"
        },
        options: {
          populate: {
            path: "_grouping",
            model: "grouping"
          },
          limit: 10,
          sort: {
            createdAt: -1
          },
        },
        model: "entry"
      })
      .exec(function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          // console.log(foundUser._entries);

          res.render("partials/userEntries", {
            userData: userInfo,
            entries: foundUser._entries
          });
        }
      });
  }

});

app.post("/userPageCollectionsPublic", function(req, res) {

  if (req.isAuthenticated()) {

    let profileName = req.body.profileName;

    AurealiusUser.findOne({
        profileName: profileName
      })
      .populate({
        path: "_groupings",
        match: {
          viewStatus: "public"
        },
        options: {
          // limit: 10,
          sort: {
            createdAt: -1
          },
        },
        model: "grouping"
      })
      .exec(function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          // console.log(foundUser._groupings);

          res.render("partials/userPageCollectionsPublic", {
            userData: foundUser,
            groupings: foundUser._groupings
          });
        }
      });
  }

});

app.post("/userEntriesPublic", function(req, res) {

  if (req.isAuthenticated()) {

    let profileName = req.body.profileName;
    // console.log(profileName);
    let requestingUser = req.user;
    // console.log(requestingUser);

    AurealiusUser.findOne({
        profileName: profileName
      })
      .populate({
        path: "_entries",
        match: {
          reportStatus: "Open",
          viewStatus: "public",
        },
        populate: {
          path: "_grouping",
          match: {
            viewStatus: "public",
          },
          model: "grouping"
        },
        options: {
          sort: {
            createdAt: -1
          },
        },
        model: "entry"
      })
      .exec(function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          // console.log(foundUser._entries[0]);
          // console.log(foundUser._entries[1]);
          // console.log(foundUser._entries[2]);

          res.render("partials/userEntriesPublic", {
            userData: foundUser,
            reqUserData: requestingUser,
            entries: foundUser._entries
          });
        }
      });
  }

});

app.post("/favoriteEntriesPublic", function(req, res) {

  if (req.isAuthenticated()) {

    let profileName = req.body.profileName;
    let requestingUser = req.user;

    AurealiusUser.findOne({
        profileName: profileName
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
          sort: {
            createdAt: -1
          },
        },
        match: {
          reportStatus: "Open",
          viewStatus: "public"
        },
        model: "entry"
      })
      .exec(function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {

          let filteredFavs = foundUser._favorites.filter(function(result) {

            if (result.viewStatus === "private" && JSON.stringify(result._user._id) !== JSON.stringify(foundUser._id)) {
              return false
            }
            return true

          });

          res.render("partials/favoriteEntriesPublic", {
            userData: foundUser,
            reqUserData: requestingUser,
            entries: filteredFavs,
            userFollowing: requestingUser._following,
          });
        }
      });
  }

});

app.post("/followingEntriesPublic", function(req, res) {

  if (req.isAuthenticated()) {

    let profileName = req.body.profileName;
    let requestingUser = req.user;

    AurealiusUser.findOne({
      profileName: profileName
    }, function(err, foundUser) {
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
              res.render("partials/followingEntriesPublic", {
                userData: foundUser,
                reqUserData: requestingUser,
                entries: foundEntries,
                userFollowing: requestingUser._following,
              });
            }
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
          sort: {
            createdAt: -1
          },
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

          let filteredFavs = foundUser._favorites.filter(function(result) {

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
    }, function(err, foundUser) {
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

app.get("/Collections", function(req, res) {

  res.render("collections");

});

app.get("/favCollections", function(req, res) {

  if (req.isAuthenticated()) {

    AurealiusUser.findOne({
        _id: req.user._id
      })
      .populate({
        path: "_groupingFavorites",
        options: {
          sort: {
            updatedAt: -1
          }
        },
        model: "grouping"
      })
      .exec(function(err, foundUser) {

        if (err) {
          console.log(err);
        } else {

          let uniqueFavs = [...new Set(foundUser._groupingFavorites.map(item => item.groupingName))];

          res.render("partials/favCollectionTiles", {
            userData: foundUser,
            favGroupings: uniqueFavs,
            groupings: foundUser._groupingFavorites
          });

        }
      });
  }

});

app.get("/unfavCollections", function(req, res) {

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
            options: {
              sort: {
                createdAt: -1
              }
            },
            model: "entry"
          })
          .sort({
            updatedAt: -1
          })
          .exec(function(err, foundGroupings) {
            if (err) {
              console.log(err);
            } else {

              let uniqueFavs = [...new Set(foundUser._groupingFavorites.map(item => item.groupingName))];

              res.render("partials/unfavCollectionTiles", {
                userData: foundUser,
                favGroupings: uniqueFavs,
                groupings: foundGroupings
              });
            }
          });
      });
  }

});

app.get("/user/:user/Collections", function(req, res) {

  let userProfileName = req.params.user;

  if (req.isAuthenticated()) {

    AurealiusUser.findOne({
      _id: req.user.id
    }).exec(function(err, foundUser) {

      AurealiusUser.findOne({
          profileName: userProfileName
        })
        .populate({
          path: "_groupingFavorites",
          options: {
            match: {
              viewStatus: "public"
            }
          },
          model: "grouping"
        })
        .exec(function(err, targetUser) {

          let favCollectionIds = [...new Set(targetUser._groupingFavorites.map(item => item._id))];

          Grouping.find({
              _user: mongoose.Types.ObjectId(targetUser._id),
              viewStatus: "public",
              _id: {
                $nin: favCollectionIds
              }
            })
            .populate({
              path: "_user",
              model: "aurealiusUser"
            })
            .exec(function(err, foundGroupings) {
              if (err) {
                console.log(err);
              } else {

                res.render("collectionsPublic", {
                  userData: foundUser,
                  targetData: targetUser,
                  favGroupings: targetUser._groupingFavorites,
                  groupings: foundGroupings
                });
              }
            });
        });
    });
  }

});

// app.get("/Collections/:hashGrouping", function(req, res) {
//
//   // let userProfileName = req.params.user;
//
//   let hashGrouping = "#" + req.params.hashGrouping;
//   // console.log(hashGrouping);
//
//   // if (req.isAuthenticated()) {
//
//     AurealiusUser.findOne({
//         _id: req.user._id
//       })
//       .populate({
//         path: "_following",
//         model: "aurealiusUser"
//       })
//       .populate({
//         path: "_followers",
//         model: "aurealiusUser"
//       })
//       .exec(function(err, foundUser) {
//
//         // console.log(foundUser);
//
//         Hashgrouping.findOne({
//             groupingName: hashGrouping,
//           })
//           .populate({
//             path: "_entries",
//             options: {
//               populate: {
//                 path: "_user",
//                 model: "aurealiusUser"
//               },
//               sort: {
//                 updatedAt: -1
//               },
//             },
//             match: {
//               viewStatus: "public",
//               reportStatus: "Open"
//             },
//             model: "entry"
//           })
//           .exec(function(err, foundHashGrouping) {
//
//             // console.log(foundHashGrouping);
//             // console.log(foundHashGrouping._entries);
//
//             if (err) {
//               console.log(err);
//             } else {
//
//               res.render("hashCollection", {
//                 userData: foundUser,
//                 userFollowing: foundUser._following,
//                 userFollowers: foundUser._followers,
//                 groupingInfo: foundHashGrouping,
//                 entries: foundHashGrouping._entries
//               });
//             }
//           });
//
//
//
//       });
//
//   // }
//
// });


app.get("/Collections/:hashGrouping", function(req, res) {

  // let userProfileName = req.params.user;

  let hashGrouping = "#" + req.params.hashGrouping;
  // console.log(hashGrouping);

  // if (req.isAuthenticated()) {

    AurealiusUser.findOne({
        _id: req.user._id
      })
      .populate({
        path: "_following",
        model: "aurealiusUser"
      })
      .populate({
        path: "_followers",
        model: "aurealiusUser"
      })
      .exec(function(err, foundUser) {

        // console.log(foundUser)
        let searchQuery = new RegExp(hashGrouping, "i");

        Entry.find({
            caption: {
              $regex: searchQuery
            },
            viewStatus: "public",
            reportStatus: "Open"
          })
          .populate({
            path: "_user",
            model: "aurealiusUser",
          })
          .sort({
            updatedAt: -1
          })
          .exec(function(err, foundHashEntries) {

            if (err) {
              console.log(err);
            } else {

              res.render("hashCollection", {
                userData: foundUser,
                userFollowing: foundUser._following,
                userFollowers: foundUser._followers,
                groupingInfo: hashGrouping,
                entries: foundHashEntries
              });
            }
          });



      });

  // }

});


app.get("/user/:user/Collections/:grouping", function(req, res) {

  let userProfileName = req.params.user;
  // console.log(userProfileName);
  let grouping = req.params.grouping.replace("%20", " ");
  // console.log(grouping);

  if (req.isAuthenticated()) {

    AurealiusUser.findOne({
        _id: req.user._id
      })
      .exec(function(err, foundUser) {

        AurealiusUser.findOne({
            profileName: userProfileName
          })
          .exec(function(err, targetUser) {

            Grouping.findOne({
                groupingName: grouping,
                _user: mongoose.Types.ObjectId(targetUser._id),
                viewStatus: "public",
              })
              .populate({
                path: "_entries",
                options: {
                  populate: {
                    path: "_user",
                    model: "aurealiusUser"
                  },
                  sort: {
                    createdAt: -1
                  },
                },
                match: {
                  viewStatus: "public",
                  reportStatus: "Open"
                },
                model: "entry"
              })
              .exec(function(err, foundGrouping) {

                // console.log(foundGrouping._entries);

                if (err) {
                  console.log(err);
                } else {

                  res.render("userCollectionPublic", {
                    userData: foundUser,
                    targetData: targetUser,
                    groupingInfo: foundGrouping,
                    entries: foundGrouping._entries
                  });
                }
              });
          });


      });

  }

});


app.get("/Collections/:grouping", function(req, res) {

  let userInfo = req.user;
  let grouping = req.params.grouping.replace("%20", " ");

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
          sort: {
            createdAt: -1
          },
        },
        match: {
          reportStatus: "Open"
        },
        model: "entry"
      })
      .exec(function(err, foundGrouping) {

        if (err) {
          console.log(err);
        } else {

          // console.log(foundGrouping._entries);
          res.render("userCollection", {
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
// app.get("/image/:filename", function(req, res) {
//
//   const file = gfs.find({
//     filename: req.params.filename
//   }, function(err, file) {
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: "No File Exist."
//       });
//     } else {
//       //--Check if file an image file--//
//       if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
//         //-read output to browser-//
//         res.set("Content-Type", "image/jpeg");
//         // const readstream = gfs.createReadStream(file.filename);
//         gfs.openDownloadStreamByName(file.filename).pipe(res);
//         // readstream.pipe(res);
//       } else {
//         res.status(404).json({
//           err: "Not an Image."
//         });
//       }
//     }
//   });
// });

app.get("/image/:filename", (req, res) => {

  const file = gfs.find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist"
        });
      }
      // console.log(files);
      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

app.get("/", function(req, res) {
  res.render("launchPage");
});

app.get("/developer", function(req, res) {
  res.render("developer");
});

app.get("/contact", function(req, res) {
  res.render("launchContactUs");
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
  res.render("developer");
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

app.post("/launchPage", function(req, res) {

  const newlaunchContact = req.body.email;
  console.log(newlaunchContact);

  LaunchContact.findOne({
    launchContact: newlaunchContact
  }, function(err, foundEmail) {
    if (err) {
      console.log(err);
    } else {
      if (foundEmail) {
        console.log("Submitted email is already on file!")

        res.status(200);
        res.json({
          message: "Thanks for your interest in Aurealius! Looks like we've already got your email. Not to worry, we will definitely let you know when we're up and running!"
        });
        res.end();

      } else {

        const launchContact = new LaunchContact({
          email: newlaunchContact
        });

        launchContact.save();
        console.log("Launch page email successfully saved!")

        res.status(200);
        res.json({
          message: "Thanks for your interest in Aurealius! We'll let you know when we're fully up and running!"
        });
        res.end();

      }
    }

  });

});

app.post("/launchContactUs", function(req, res) {

  const launchContactUsInquiry = req.body.data;
  console.log(launchContactUsInquiry);

  const launchContactUsForm = new LaunchContactUsForm({
    firstName: launchContactUsInquiry.firstName,
    lastName: launchContactUsInquiry.lastName,
    email: launchContactUsInquiry.email,
    contactRationale: launchContactUsInquiry.contactRationale,
    lContactContent: launchContactUsInquiry.lContactContent
  });

  console.log(launchContactUsForm);

  launchContactUsForm.save();
  console.log("Launch contact inquiry successfully saved!")

  res.status(200);
  res.json({
    message: "We will follow up with you as soon as we can."
  });
  res.end();

});

app.post("/developerAccess", function(req, res) {

  let accessKeyField = req.body.developerAccessKey;
  console.log(accessKeyField);

  if (accessKeyField === "isaweneskanter") {
    res.render("login");

  } else {
    res.send("Incorrect Access Token!");
  }

});

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
        res.redirect("/Everyone");
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
        res.redirect("everyone");
      });
    }
  });
});

app.post("/login", passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: {
    type: "error",
    message: "Uh oh! Invalid username or password. Please try again."
  }
}), function(req, res) {

    let userSessions = req.user.sessions;
    let updatedUserSessions = ++userSessions;

    AurealiusUser.updateOne({
      _id: req.user.id
    }, {
      sessions: updatedUserSessions
    }, function(err, succss) {
      if(err) {
        console.log(err);
      } else {

        console.log("Successfully updated user session count.");
        res.redirect("/Everyone");
      }
    });

});

app.post("/goToregister", function(req, res) {

  res.render("register");

});

app.post("/upload", upload.single("file"), function(req, res) {

  // const requestingURL = req.header('Referer');
  // const requestingURLExtension = requestingURL.split("/").pop();
  // console.log(requestingURLExtension);

  function fileExists() {
    if (typeof req.file === "undefined") {
      let fileName = "NOTHING TO SEE HERE";
      return fileName
    } else {
      let fileName = req.file.filename;
      return fileName
    }
  }

  const fileExistResult = fileExists();

  const userCollectionPrivacy = req.body.groupingViewStatus;
  console.log(userCollectionPrivacy);

  const collectionPageGrouping = req.body.groupingName;
  console.log(collectionPageGrouping);

  const userCollectionChoice = req.body.grouping;
  console.log(userCollectionChoice);

  function collectionAllocator() {

    if (userCollectionChoice === "" && collectionPageGrouping === "") {
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
      if (collectionPageGrouping === "") {
        return userCollectionChoice;
      } else {
        return collectionPageGrouping;
      }
    }
  }

  const allocatedCollection = collectionAllocator();
  console.log(allocatedCollection);

  const currentUser = req.user.id;
  let entryCaption = req.body.caption;
  // const currentUserProfile = req.user.profileName;

  function statusAssignment() {
    const pubPri = req.body.status;

    if (pubPri === "private") {
      return pubPri;
    } else {
      let entryStatus = "public";
      return entryStatus;
    }
  }

  const entryStatusAssigned = statusAssignment();

  const newEntry = new Entry({
    imageFile: fileExistResult,
    caption: entryCaption,
    _user: mongoose.Types.ObjectId(currentUser),
    viewStatus: entryStatusAssigned,
    reportStatus: "Open",
  });

  newEntry.save(function(err, entry) {
    if (err) {
      console.log(err);
    } else {

      console.log("New entry successfully saved.");

      AurealiusUser.update({
        _id: currentUser
      }, {
        $push: {
          _entries: mongoose.Types.ObjectId(entry._id)
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

              // console.log(foundGroupings);

              let uniqueGroupings = [...new Set(foundGroupings.map(item => item.groupingName))];

              // console.log(uniqueGroupings);

              if (!uniqueGroupings.includes(allocatedCollection)) {

                const newGrouping = new Grouping({
                  groupingName: allocatedCollection,
                  groupingImageFile: fileExistResult,
                  userDesignatedImage: false,
                  _user: mongoose.Types.ObjectId(currentUser),
                  _entries: [mongoose.Types.ObjectId(newEntry._id)],
                  viewStatus: userCollectionPrivacy
                });

                newGrouping.save(function(err, brandNewGroup) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("New grouping successfully added to Grouping Collection.");

                    AurealiusUser.update({
                      _id: currentUser
                    }, {
                      $push: {
                        _groupings: mongoose.Types.ObjectId(brandNewGroup._id)
                      }
                    }, function(err, success) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log("Successfully added grouping to aurealiusUsers.");
                        Entry.update({
                          _id: newEntry._id
                        }, {
                          $push: {
                            _grouping: mongoose.Types.ObjectId(brandNewGroup._id)
                          }
                        }, function(err, success) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Successfully added groupId to entry.");
                          }
                        });
                      }
                    });
                  }
                });

              } else {

                if (fileExists() != "NOTHING TO SEE HERE") {

                  Grouping.findOneAndUpdate({
                    groupingName: allocatedCollection,
                    _user: mongoose.Types.ObjectId(currentUser),
                  }, {
                    $push: {
                      _entries: mongoose.Types.ObjectId(newEntry._id)
                    }
                  }, function(err, updatedGrouping) {
                    console.log("New entry added to existing Grouping.");

                    // console.log(updatedGrouping.userDesignatedImage);
                    // console.log(updatedGrouping._id);

                    if (updatedGrouping.userDesignatedImage === false || updatedGrouping.userDesignatedImage === null) {

                      Grouping.findOneAndUpdate({
                        _id: updatedGrouping._id,
                      }, {
                        $set: {
                          groupingImageFile: fileExistResult
                        }
                      }, function(err, success) {
                        if (err) {} else {
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
                        }
                      });

                    }

                  });

                } else {

                  Grouping.findOneAndUpdate({
                    groupingName: allocatedCollection,
                    _user: mongoose.Types.ObjectId(currentUser),
                  }, {
                    $push: {
                      _entries: mongoose.Types.ObjectId(entry._id)
                    }
                  }, function(err, updatedGrouping) {
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

    }
    res.redirect("back");
  });

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
  }, {
    bioImageFile: userFileExists()
  }, function(err, success) {
    if (err) {
      console.log(err)
    } else {
      console.log("Succesfully updated userBioImage.")
    }
  });

  res.status(200);
  res.end(userFileExists());

});

app.post("/changeCltImage", upload.single("file"), function(req, res) {

  let groupingId = req.body.groupingId;

  function cltFileExists() {
    if (typeof req.file === "undefined") {
      let cltFileName = "";
      return cltFileName
    } else {
      let cltFileName = req.file.filename;
      return cltFileName
    }
  }

  Grouping.findOneAndUpdate({
    _id: groupingId
  }, {
    $set: {
      groupingImageFile: cltFileExists(),
      userDesignatedImage: true,
    }
  }, function(err, success) {
    if (err) {
      console.log(err)
    } else {
      console.log("Succesfully updated groupingImage.")
    }
  });

  res.redirect("back");

});

app.post("/collectionNameUpdate", function(req, res) {

  let collectionId = req.body._id;
  let newCltName = req.body.groupingName;

  Grouping.findOne({
    _id: collectionId,
  }, function(err, foundGrouping) {

    if (JSON.stringify(foundGrouping._user) === JSON.stringify(req.user.id)) {

      Grouping.updateOne({
        _id: collectionId,
      }, {
        $set: {
          groupingName: newCltName
        }
      }, {
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
      reminderSettings: emailSettingsDataObj
    }
  }, {
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

    AurealiusUser.findOne({
      email: uploadFieldOjb.email
    }, function(err, foundUser) {

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
        res.end();
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
  console.log(followTargetId);

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

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
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

            if (JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user._id)) {

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

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Grouping.findOne({
          _id: collectionId
        })
        .populate({
          path: "_entries",
          model: "entry"
        })
        .exec(function(err, foundCollection) {
          if (err) {
            console.log(err);
          } else {

            if (JSON.stringify(foundUser._id) === JSON.stringify(foundCollection._user._id)) {

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

                  if (viewStatus === "private") {
                    console.log(foundCollection._entries);

                    let collectionEntryIds = [...new Set(foundCollection._entries.map(item => item._id))];

                    Entry.updateMany({
                      _id: collectionEntryIds
                    }, {
                      $set: {
                        viewStatus: viewStatus
                      }
                    }, function(err, success) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log("Successfully changed all entries to private viewStatus.")
                      }
                    });
                  }

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

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      Entry.findOne({
        _id: req.body._id
      }, function(err, foundEntry) {
        if (err) {
          console.log(err);
        } else {

          if (JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user._id)) {

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
  console.log(deleteBtnimageFile);

  AurealiusUser.findOne({
    _id: req.user.id
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {

      Entry.findOne({
        _id: deleteBtnEntryId
      }, function(err, foundEntry) {
        if (err) {
          console.log(err);
        } else {

          if (JSON.stringify(foundUser._id) === JSON.stringify(foundEntry._user)) {

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
                  console.log("Successfully deleted entry from entries db collection.");

                  // gfs.remove({
                  gfs.find({
                      filename: deleteBtnimageFile
                    })
                    .toArray(function(err, files) {

                      if (!files || files.length === 0) {
                        return res.status(404).json({
                          err: "No Files Exist."
                        });

                      } else {
                        console.log(files);
                        gfs.delete(new mongoose.Types.ObjectId(files[0]._id), function(err, success) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Successfully deleted entry upload.");
                            res.status(200);
                            res.end();
                          }
                        });
                      }
                    });

                };
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

        if (JSON.stringify(foundGrouping._user) === JSON.stringify(req.user.id)) {

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

          if (!groupingImageFileArray.includes(foundGrouping.groupingImageFile)) {
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
          }, function(err, updatedUser) {

            console.log(groupingEntriesObjArray);

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
                }, function(err, success) {
                  console.log("Succesfully deleted all entries from grouping.");
                  // console.log(foundGrouping.groupingImageFile);

                  // gfs.remove({
                  groupingImageFileArray.forEach(function(imageFile) {

                    console.log(imageFile);

                    gfs.find({
                      filename: imageFile
                    }).toArray(function(err, fileIds) {

                      if (!fileIds || fileIds.length === 0) {
                        return res.status(404).json({
                          err: "No Files Exist."
                        });
                      } else {

                        gfs.delete(new mongoose.Types.ObjectId(fileIds[0]._id), function(err, success) {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log("Successfully removed " + imageFile + " from uploads directory.");
                            // res.redirect("back");
                          }

                        });
                      }
                    });

                  });

                  res.redirect("back");

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
