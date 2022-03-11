/*
  dependencies - 
*/
const express = require('express')

/*
  dependencies - firebase
*/
// download from firebase by creating a web app, save in folder and adjust path
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getStorage  } = require('firebase-admin/storage');
const serviceAccount = require('./serviceAccountKey.json');
/*
  config - firestore
*/
initializeApp({
  credential: cert(serviceAccount),
  // for cloud storage
  storageBucket: 'gs://qsandbox-a5214.appspot.com'
});

const db = getFirestore();
const bucket = getStorage().bucket();

/*
  dependencies - busboy
*/
const busboy = require('busboy');
const { log } = require('console');
const inspect = require('util').inspect
// packages for saving a file to the tmp folder in the server
let path  = require('path');
let os  = require('os');
let fs  = require('fs');
const { createInflate } = require('zlib');
let UUID = require('uuid-v4')


/*
  config - express
*/
const app = express()
//app.use(fileUpload()); // Don't forget this line!

let port = 3000

/*
  config - algolia
*/
const algoliasearch = require("algoliasearch");
 // initialize algolia
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
  );
  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);


/*
  config - cors
*/
//https://stackoverflow.com/questions/43871637/no-access-control-allow-origin-header-is-present-on-the-requested-resource-whe
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}
app.use(cors(corsOptions)) // Use this after the variable declaration

/*
  listen on Heroku or home port 
*/
app.listen(process.env.PORT || port, () => {
  console.log(`${port}`)
  console.log('Demonic powers compel you');
})

/*
  endpoint - test
*/
app.get('/', (request, response) => {
  response.send('FLOOey')
})

/*
  endpoint - posts
*/
app.get('/posts', (request, response) => {
  // access for Heroku
  response.set("Access-Control-Allow-Origin", "*")
  //
  
  let posts = [] 

  db.collection('posts').orderBy('date','desc').get().then(snapshot => {
    snapshot.forEach((doc) => {
      posts.push(doc.data())
    });
     response.send(posts)
  })

  // db
  // .collection('posts')
  // .orderBy('date', 'desc')
  //   .onSnapshot((snapshotChange) => {
  //     snapshotChange.forEach((doc) => {
  //       posts.push(doc.data())
  //     })
  //     response.send(posts)
  //   })
})

/*
  endpoint - create post
*/
app.post('/posts-create', (request, response) => {
  response.set("Access-Control-Allow-Origin", "*")

  // create an uuid for this
  let uuid = UUID()

  // process response containing the form data via busboy
  const bb = busboy({ headers: request.headers });

  
  let fields = {}
  let fileData = {}

  let pdfFile = {}
  let pdfUrl = ''

    //on-file hook do this for every file
  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(
      `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
      filename,
      encoding,
      mimeType
    );
    // write the file to the tmp folder on the server
    // gets the filepath by joining the tmpdir() path from the os package and the filename
    let filepath = path.join(os.tmpdir(), filename)
    // creates a writestream with the assigned filepath and writes it to the tmp folder
    file.pipe(fs.createWriteStream(filepath))
    // writes required stuff into a fileData object
    fileData = { filepath, mimeType }
    // pdfFile = file
    file.on("data", (data) => {
      // ... and write the file's name, type and content into `fields`.
      pdfFile = data
      // console.log('pdfFile', pdfFile);
    });
  });

  //on-field hook - do this for every field
  bb.on('field', (name, val, info) => {
    fields[name] = val
  });

  // runs this when it's done processing all the data
  // here is where you actually insert stuff into the firestore db
  bb.on('close', () => {
    console.log('fields: ', fields);

    // upload the file from the tmp folder on the server into the firestore storage bucket
    bucket.upload(
      fileData.filepath, 
      {
        uploadType: 'media',
        metadata: {
          metadata: {
            contentType: fileData.mimeType,
            firebaseStorageDownloadTokens: uuid
          }
        },
      },
      (err, uploadedFile) => {
        if (!err) {
          createFile(uploadedFile)
        }
        else 
          console.log(err);
      }
    )
    // creates a file and post on firebase
    function createFile(uploadedFile) {
      
      pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${ bucket.name }/o/${ uploadedFile.name }?alt=media&token=${ uuid }`

      // post fields to firestore
      db.collection('posts').doc(fields.id).set({
        id: fields.id,
        caption: fields.caption,
        location: fields.location,
        // convert to integer
        date: parseInt(fields.date),
        fileUrl: pdfUrl
      }).then( () => {
        
        // index the document in algolia search
        console.log('fileData', fileData);
        console.log('pdfFile', pdfFile);

        // let loadingTask = pdfjsLib.getDocument(pdfUrl);
        // loadingTask.promise.then(function (pdf) {
        // console.log('PDF loaded');

          response.send('Post added: ' + fields.id)
        // });
  
        
         // load up PDFTron SDK without the WebViewer
        // const CoreControls = window.CoreControls;
        //CoreControls.setWorkerPath('/webviewer/core');
        //const doc = await CoreControls.createDocument(pdfFile);
        
        //doc = pdfFile
        // let i;
       //console.log(doc.getPageCount());
       //for (i = 0; i < doc.getPageCount(); i++) {
        //   let pageNum = i + 1;
        //   doc.loadPageText(i, text => pushData(text, pageNum));
        //}
        
        
      })
    }
    console.log('Done parsing form. Demonic powers compel you');
  });
  // actually run busboy
  request.pipe(bb);
})

/*
  endpoint - delete post
*/
// https://expressjs.com/en/guide/routing.html
app.delete('/delete/:id', (request, response) => {
  // access for Heroku
  response.set("Access-Control-Allow-Origin", "*")

  let post = {}
  
  // get the actual post so we can have the info. unnecessary but let's have it.
  db.collection('posts').where("id", "==", request.params.id).get()
    .then((querySnapshot) => {
      
      querySnapshot.forEach((doc) => {
        
        // get the post
        post = doc.data()
        //create the fileName
        let fileName = post.id + '.pdf'
      
        const file = bucket.file(fileName);
        file.delete().then(() => {
          // if the file is deleted, proceed to delete the post
          db.collection('posts').doc(post.id).delete()
          .then(() => {
            console.log('post ' + post.id + ' deleted');
          })
          .catch((error) => {
            console.log('post not deleted', error );
          });
        }).catch((error) => {
          console.log('Storage file couldnt be deleted.', error);
        });
      });
  })
  .catch((error) => {
      console.log("Error getting posts: ", error);
  });



})




// https://www.jsdelivr.com/package/npm/pdfjs-dist?path=build
// https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.min.js
// https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.worker.min.js


// var pdfjs = require('pdfjs-dist/build/pdf.js');
// let pdfjsWorker = 'pdfjs-dist/build/pdf.worker.js';
// pdfjs.GlobalWorkerOptions.workerPort = pdfjsWorker;

// var pdfjs = require('pdfjs-dist/build/pdf.js');
//let pdfjsWorker = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.worker.min.js';
//pdfjs.GlobalWorkerOptions.workerPort = pdfjsWorker;
// We need to get the url of the worker (we use min for prod)


/*
  endpoint - pdf-test
*/

// pdfjsLib = require('../public/pdfjs/build/pdf.js');
// let pdfjsWorker = require('../public/pdfjs/build/pdf.worker.js');
// pdfjsLib.GlobalWorkerOptions.workerPort = pdfjsWorker

//var myModule = require('../public/pdfjs/web/viewer.js');

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

app.post('/pdf-test', (request, response) => {
  response.set("Access-Control-Allow-Origin", "*")


    // process response containing the form data via busboy
    const bus = busboy({ headers: request.headers });

    let fields = {}
    //on-field hook - do this for every field
    bus.on('field', (name, val, info) => {
      fields[name] = val
    });
    
    // busboy close hook
    bus.on('close', () => {
      fileUrl = fields.fileUrl
      fakeFileUrl = 'https://www.orimi.com/pdf-test.pdf'
      const pdfPath =
        process.argv[2] || 'https://www.orimi.com/pdf-test.pdf';

    const t = pdfjsLib.getDocument(pdfPath);
      t.promise.then(function (doc) {
        console.log('got doc');
        // console.log(doc);
      })
      .catch(err => {
        console.log(err);
      });

      console.log('Done djidjing. Demonic powers compel you');
      response.send('I djidjed.')
    })
  // actually run busboy
  request.pipe(bus);
    
})
