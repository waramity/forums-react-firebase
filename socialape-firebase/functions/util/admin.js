const admin = require("firebase-admin");
var serviceAccount = require("../socialape-47b5d-firebase-adminsdk-dwbzh-6a7b74b223.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://socialape-47b5d.firebaseio.com"
// });
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-47b5d.firebaseio.com",
  storageBucket: "socialape-47b5d.appspot.com",
});

const db = admin.firestore();

module.exports = { admin, db };
