const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// var serviceAccount = require("./socialape-47b5d-firebase-adminsdk-dwbzh-6a7b74b223.json");

// const express = require("express");
// const app = express();
const app = require("express")();
const FBAuth = require("./util/fbAuth");
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://socialape-47b5d.firebaseio.com"
// });

const { db } = require("./util/admin");

const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");
// Scream route
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);
app.get("/scream/:screamId", getScream);
// TODO: delete scream
app.delete("/scream/:screamId", FBAuth, deleteScream);
// TODO: like a scream
app.get("/scream/:screamId/like", FBAuth, likeScream);
// TODO: unlike a scream
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
// TODO:  comment on scream
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

// user route
app.post("/signup", signup);
app.post("/login", login);
// set "FBAuth" to check authorization for not anyone to access this feature
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", markNotificationsRead);
// exports.api = functions.https.onRequest(app);
exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.deleteNotificationOnUnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("image has changed");
      const batch = db.batch();
      return db
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDeleted = functions
  .region("europe-west1")
  .firestore.document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("likes")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });
//=========== User authentication
// const firebase = require("firebase");
// Your web app's Firebase configuration
// var firebaseConfig = {
//   apiKey: "AIzaSyAZxeQMEYWMCWOjmr-14fD08-Adv3ggdlk",
//   authDomain: "socialape-47b5d.firebaseapp.com",
//   databaseURL: "https://socialape-47b5d.firebaseio.com",
//   projectId: "socialape-47b5d",
//   storageBucket: "socialape-47b5d.appspot.com",
//   messagingSenderId: "79673108529",
//   appId: "1:79673108529:web:7de9ea240d315e5cec8d10",
//   measurementId: "G-0XLT84G04M"
// };
// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// firebase.analytics();

//=========== Express section
//=========== Get all data in collection "Screams"
// Function URL (getScreams): https://us-central1-socialape-47b5d.cloudfunctions.net/api/screams
// const db = admin.firestore();

// app.get("/screams", (req, res) => {
//   // admin
//   //   .firestore()
//   db.collection("screams")
//     .orderBy("createdAt", "desc")
//     .get()
//     .then(data => {
//       let screams = [];
//       data.forEach(doc => {
//         // screams.push(doc.data());
//         screams.push({
//           screamId: doc.id,
//           // ...doc.data()
//           body: doc.data().body,
//           userHandle: doc.data().userHandle,
//           createdAt: doc.data().createdAt,
//           //====================
//           commentCount: doc.data().commentCount,
//           likeCount: doc.data().likeCount
//           //====================
//         });
//       });
//       return res.json(screams);
//     })
//     .catch(err => console.error(err));
// });

//check authorization of header that look like this "Bearer {token}"
//Then send the token to collection to get the user handle
// const FBAuth = (req, res, next) => {
//   let idToken;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer ")
//   ) {
//     idToken = req.headers.authorization.split("Bearer ")[1];
//   } else {
//     console.error("No token found");
//     return res.status(403).json({ error: "Unauthorized" });
//   }
//   admin
//     .auth()
//     .verifyIdToken(idToken)
//     .then(decodedToken => {
//       req.user = decodedToken;
//       console.log(decodedToken);
//       return db
//         .collection("users")
//         .where("userId", "==", req.user.uid)
//         .limit(1)
//         .get();
//     })
//     .then(data => {
//       console.log(req);
//       req.user.handle = data.docs[0].data().handle;
//       return next();
//     })
//     .catch(err => {
//       console.error("Error while verifyinh token", err);
//       return res.status(403).json(err);
//     });
// };

// Post one scream
// app.post("/scream", FBAuth, (req, res) => {
//   if (req.body.body.trim() === "") {
//     return res.status(400).json({ body: "Body must not be empty" });
//   }
//   const newScream = {
//     body: req.body.body,
//     userHandle: req.user.handle,
//     // createdAt: admin.firestore.Timestamp.fromDate(new Date())
//     createdAt: new Date().toISOString()
//   };
//
//   // admin
//   //   .firestore()
//   db.collection("screams")
//     .add(newScream)
//     .then(doc => {
//       res.json({ message: `document ${doc.id} created successfull` });
//     })
//     .catch(err => {
//       res.status(500).json({ error: "something went wrong!" });
//       console.error(err);
//     });
// });

//============ Vanilla JavaScript ==============
// =========== Hello world
// Function URL (helloWorld): https://us-central1-socialape-47b5d.cloudfunctions.net/helloWorld

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   response.send("Hello from Firebase!");
// });

//=========== Get all data in collection "Screams"
// Function URL (getScreams): https://us-central1-socialape-47b5d.cloudfunctions.net/getScreams

// exports.getScreams = functions.https.onRequest((req, res) => {
//   admin
//     .firestore()
//     .collection("screams")
//     .get()
//     .then(data => {
//       let screams = [];
//       data.forEach(doc => {
//         screams.push(doc.data());
//       });
//       return res.json(screams);
//     })
//     .catch(err => console.error(err));
// });

//========== Create data in collections
// Function URL (getScreams): https://us-central1-socialape-47b5d.cloudfunctions.net/createScreams
// exports.createScream = functions.https.onRequest((req, res) => {
//   if (req.method !== "POST") {
//     return res.status(400).json({ error: "Method not allowed" });
//   }
//   const newScream = {
//     body: req.body.body,
//     userHandle: req.body.userHandle,
//     createdAt: admin.firestore.Timestamp.fromDate(new Date())
//   };
//
//   admin
//     .firestore()
//     .collection("screams")
//     .add(newScream)
//     .then(doc => {
//       res.json({ message: `document ${doc.id} created successfull` });
//     })
//     .catch(err => {
//       res.status(500).json({ error: "something went wrong!" });
//       console.error(err);
//     });
// });
//=========Validation & Login Route

// const isEmail = email => {
//   const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//   if (email.match(regEx)) return true;
//   else return false;
// };
//
// const isEmpty = string => {
//   if (string.trim() === "") return true;
//   else return false;
// };

//=========Signup route for user authentication;

// app.post('/signup', signup)
// app.post('/login', login)
// app.post("/signup", (req, res) => {
//   const newUser = {
//     email: req.body.email,
//     password: req.body.password,
//     confirmPassword: req.body.confirmPassword,
//     handle: req.body.handle
//   };
//
//   let errors = {};
//
//   if (isEmpty(newUser.email)) {
//     errors.email = "Must not be empty";
//   } else if (!isEmail(newUser.email)) {
//     errors.email = "Must be a valid email address";
//   }
//
//   if (isEmpty(newUser.password)) errors.password = "Must not empty";
//   if (newUser.password !== newUser.confirmPassword)
//     errors.confirmPassword = "Password must match";
//   if (isEmpty(newUser.handle)) errors.handle = "Must not empty";
//
//   if (Object.keys(errors).length > 0) return res.status(400).json(errors);
//
//   //validate data
//   let token = "kuy",
//     userId;
//   db.doc(`/users/${newUser.handle}`)
//     .get()
//     .then(doc => {
//       if (doc.exists) {
//         return res.status(400).json({
//           handle: "this handle is already taken"
//         });
//       } else {
//         //create user data in "Authentication" section
//         return firebase
//           .auth()
//           .createUserWithEmailAndPassword(newUser.email, newUser.password);
//       }
//     })
//     .then(data => {
//       // const userId = data.user.uid;
//       userId = data.user.uid;
//       return data.user.getIdToken();
//     })
//     .then(tokenId => {
//       console.log("token: " + token);
//       token = tokenId;
//       const userCredentials = {
//         handle: newUser.handle,
//         email: newUser.email,
//         createdAt: new Date().toISOString(),
//         userId
//       };
//       console.log("token id: " + tokenId);
//       console.log("token: " + token);
//       //Put the data into 'users' collections of database
//       return db.doc(`/users/${newUser.handle}`).set(userCredentials);
//       // return res.status(201).json({ token });
//     })
//     .then(() => {
//       return res.status(201).json({ token: token });
//     })
//     .catch(err => {
//       console.error(err);
//       if (err.code === "auth/email-already-in-use") {
//         return res.status(400).json({ email: "Email is already in use" });
//       } else {
//         return res.status(500).json({ error: err.code });
//       }
//     }
// }
// );

// firebase
//   .auth()
//   .createUserWithEmailAndPassword(newUser.email, newUser.password)
//   .then(data => {
//     return res.status(201).json({
//       message: `user ${data.user.uid} signed up successfully`
//     });
//   })
//   .catch(err => {
//     console.error(err)
//     return res.status(500).json({ error: err.code })
//   })
// });

// app.post("/login", (req, res) => {
//   const user = {
//     email: req.body.email,
//     password: req.body.password
//   };
//
//   let errors = {};
//
//   if (isEmpty(user.email)) errors.email = "Must not be empty";
//   if (isEmpty(user.password)) errors.password = "Must not be empty";
//
//   if (Object.keys(errors).length > 0) return res.status(400).json(errors);
//
//   firebase
//     .auth()
//     .signInWithEmailAndPassword(user.email, user.password)
//     .then(data => {
//       return data.user.getIdToken();
//     })
//     .then(token => {
//       return res.json({ token });
//     })
//     .catch(err => {
//       console.error(err);
//       if (err.code === "auth/wrong-password")
//         return res
//           .status(403)
//           .json({ general: "Wrong credentials, pls try again." });
//       return res.status(500).json({ error: err.code });
//     });
// });

// https://baseurl.con/screams <=== It not good to use like this wthout /api
// https://baseurl.con/api

// exports.api = functions.https.onRequest(app);

//Change region to Deploy
// exports.api = functions.region('europe-west1').https.onRequest(app);
