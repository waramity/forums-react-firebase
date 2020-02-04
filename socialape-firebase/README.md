========Firebase Setup

1. Create app on firebase web
2. use command in project directory
  - firebase init
    -- choose CLI feature as "Functions: Configure and deploy Cloud Functions"
    === Project Setup

    ? Please select an option: Use an existing project
    ? Select a default Firebase project for this directory: socialape-47b5d (sociala
    pe)
    i  Using project socialape-47b5d (socialape)

    ? What language would you like to use to write Cloud Functions? JavaScript
    ? Do you want to use ESLint to catch probable bugs and enforce style? No
    ? Do you want to install dependencies with npm now? Yes

3. Create database from "Database" section in Firebase app
4. To create field of the database, you will need to "start Collections" and set "collection ID".
5. Create each field and set both type and value, for example
  - Field: userHandle
    -- Type: string
    -- Value: user
  - Field: createAt
    -- Type: timestamp
      --- Date: 14/03/2019
      --- Time: 00:00
  ** In same collections, you can create another document field whatever you want

6. To get the data from collections, we use the firebase feature name as "Firestore"
More description about "Firestore": https://firebase.google.com/docs/firestore

========Firebase command
  -global
    -- firebase deploy
    -- firebase deploy -m "Comment"
    -- firebase deploy --only functions

  - local
    -- firebase serve

======= Allow firebase local serve to request
From :

var admin = require('firebase-admin')

admin.initializeApp()
To:

var admin = require('firebase-admin');
var serviceAccount = require('path/to/serviceAccountKey.json');

admin.initializeApp({
credential: admin.credential.cert(serviceAccount),
databaseURL: 'https://my-project.firebaseio.com'
});

========Postman how to POST
1. To post, you need to request wth data
2. Go to "Body" section and change the type of data to "raw" wth JSON file extension
3. example data
{
"body": "new scream",
"userHandle": "new"
}

***Beware*** Check the method of request first

=========Express Get started
1. Change directory to "functions" folder from firebase project folder
2. npm i --save Express

=========User authentication get started
1. Go to "Authentication" section in firebase app project.
2. Click "Set-up signing method" btn
3. Edit "Email/Password" provider
4. Enable and save this provider
5. Go to "Project settings"
6. Click "web app" icon on "Your apps" section
  -- Now, you will get "firebaseConfig"
7. Change directory to "functions" folder
8. npm i --save firebase

**** Uid and token id are difference

=========Validation & Login Route get started
  See /signup and /login code section

========= Authentication Middleware at FBAuth() func.
1. Open Postman
  -- select file type as "raw"
  -- set the headers "Content-Type" key and "application/json" value
2. In "Headers" section, add KEY as "Authorization" under "Content-Type"
3. Add "VALUE" as "Bearer {token}"
4. {token} is the token id that get after request the post at /api/login

========= Image Upload
1. npm install --save busboy
2. service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
3. but we must only allow "read" to go on public
4. Then, go to "Storage" section in Firebase apps
5. Change the code in "Rules" tab as
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read;
    }
  }
}
6. To upload another image on Postman,
  we need to change data type in 'Body' section to 'form-data' type

========== Create comment collections
1. create collections "comments"
body: "nice scream naja!"
createdAt: "2020-01-14T06:34:19.331Z"
screamId: "4C2CvVYWOwvkKWdvhh48"
userHandle: "user"

========== Create Index for ascending, descending the order of collections
1. To use .orderBy('createdAt', 'desc') like
  db
    .collection("comments")
    .orderBy('createdAt', 'desc')
    .where("screamId", "==", req.params.screamId)
    .get();
2. we need to request to api link First
3. After we must recieve the error like this:
Error: 9 FAILED_PRECONDITION: The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/socialape-47b5d/firestore/indexes?create_composite=ClBwcm9qZWN0cy9zb2NpYWxhcGUtNDdiNWQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NvbW1lbnRzL2luZGV4ZXMvXxABGgwKCHNjcmVhbUlkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
4. The link will get access to create composite index

========== Create notification wth firebase trigger
1. See more: FireStore trigger
2. Benefit for trigger
  -- Not request to db to change document and collections
  -- Call for one changed function and multiple changed use trigger
  -- Change data in field of document will happen with another data in another collection

========= Rest API permission
1. If we dont change the rules of Database to not allow read, write
  anyone can get the data from this link:
  https://firestore.googleapis.com/v1/projects/YOUR-PROJECT-ID/databases/(default)/documents/API-ENDPOINT
2. you need to change code as this:
  rules_version = '2';
  service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone on the internet to view, edit, and delete

    // all data in your Firestore database. It is useful for getting

    // started, but it is configured to expire after 30 days because it

    // leaves your app open to attackers. At that time, all client

    // requests to your Firestore database will be denied.

    // Make sure to write security rules for your app before that time, or else

    // your app will lose access to your Firestore database
    match /{document=**} {
      allow read, write: if false;

      // allow read, write: if request.time < timestamp.date(2020, 2, 6);
    }
  }
  }
