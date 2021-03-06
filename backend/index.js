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
  config - pdfjs 
*/
// legacy pdfjs to avoid webpack complications
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/*
  config - typesense
*/
require('dotenv').config();
// console.log(process.env)
// import Typesense from 'typesense'
const Typesense = require('typesense');
let TsenseClient = new Typesense.Client({
  'nodes': [{
    'host':  process.env.TYPESENSE_NODES, //Typesense Cloud cluster
    'port': '443',
    'protocol': 'https'
  }],
  'apiKey': process.env.TYPESENSE_API_KEY,
  'connectionTimeoutSeconds': 2
})
const Collection = process.env.TYPESENSE_COLLECTION

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
  //     console.log('Im in a snapshot demon');
  //     return response.send(posts)
  //   })
})

/*
  endpoint - delete all firestore and typesense data, with extereme prejudice
*/
app.delete('/delete-firestore', (request, response) => {
  // access for Heroku
  response.set("Access-Control-Allow-Origin", "*")

  db.collection('posts').get().then(snapshot => {
    snapshot.forEach((doc) => {
      //let fileUrl = doc._fieldsProto.fileUrl.stringValue
      let fireId = doc._fieldsProto.id.stringValue
      TsenseClient.collections(Collection).documents(fireId).delete()
      doc._ref.delete()
    });
    console.log('Delete djidja finished. Demonic powers compel you.');
    response.send('All content deleted.')
  })
})


/*
  endpoint - create posts from pdf files in a folder
*/
app.post('/rebuild-whole-database', (request, response) => {
  // response.set("Access-Control-Allow-Origin", "*")

  //requiring path and fs modules
  const path = require('path');
  const fs = require('fs');
  //joining path of directory 
  let directoryPath = path.join(__dirname, '');
  directoryPath = directoryPath.replace('backend', 'public\\pdfjs\\catalogues') 
  
  // delete everything from firestore and Typesense
  db.collection('posts').get().then(snapshot => {
    snapshot.forEach((doc) => {
      //let fileUrl = doc._fieldsProto.fileUrl.stringValue
      let fireId = doc._fieldsProto.id.stringValue
      TsenseClient.collections(Collection).documents(fireId).delete()
      doc._ref.delete()
    });
  })

  //passsing directoryPath and callback function
  fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      } 
      //listing all files using forEach
      files.forEach(function (file) {
              
        if (file.endsWith('.pdf')) {
        
          // get file data
          let uuid = UUID()
          let fileName = file.replace('.pdf', '')
          let fileUrl = path.join(directoryPath, file);

          // get file text
          const pdfJsPromise = pdfjsLib.getDocument(fileUrl)

          pdfJsPromise.promise.then(function (doc) {

            const numPages = doc.numPages;

            console.log(`Got doc with ${numPages} pages... ${fileName}`);
            let pagesPromises = [];

            for (let i = 1; i <= doc.numPages; i++) {
              pagesPromises.push(getPageText(i, doc));
            }

            Promise.all(pagesPromises).then(function (pagesText) {
              // join text
              let fileText = pagesText.join(" ")

              if (fileText.length > 10) {
                  postToFirestore(uuid, fileName, fileUrl, fileText);
              }
              else {
                console.log(fileName, ' UNREADABLE. SKIPPED.');
              }
            });

                // Retrieves the text of a specif page within a PDF Document obtained through pdf.js
                function getPageText(pageNum, PDFDocumentInstance) {
                  // Return a Promise that is solved once the text of the page is retrieven
                  return new Promise(function (resolve, reject) {
                    PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
                      // The main trick to obtain the text of the PDF page, use the getTextContent method
                      pdfPage.getTextContent().then(function (content) {
                            
                        const strings = content.items.map(function (item) {
                          return item.str;
                        });
                        fileText = strings.join(" ")
                        // Solve promise with the text retrieven from the page
                        resolve(fileText);
                      });
                    });
                  });
                }
          }) //pdfJsPromise.promise.
          .catch(err => {
            console.log(err);
          });
        }        
      });
  });

  // posts file to firestore and typesense; meant for newly found files
  function postToFirestore(uuid, caption, fileUrl, fileText) {

    db.collection('posts').doc(uuid).set({
      id: uuid,
      caption: caption,
      // convert to integer
      date: parseInt(Date.now()),
      fileUrl: fileUrl
    }).then(() => {
      // send text to typesense
      let document = {
        "id": uuid,
        "text": fileText,
        "fileUrl": fileUrl, 
        "caption": caption
      }
      TsenseClient.collections(Collection).documents().create(document)
        .catch(err => {
          console.log(err);
        });
    })  
  }

  console.log('Demonic djidja done.');
  response.send('I djidjed.')
})


/*
  endpoint - create posts from pdf files in a folder
*/
app.post('/refresh-all-files', (request, response) => {
  // response.set("Access-Control-Allow-Origin", "*")

  //requiring path and fs modules
  const path = require('path');
  const fs = require('fs');
  //joining path of directory 
  let directoryPath = path.join(__dirname, '');
  directoryPath = directoryPath.replace('backend', 'public\\pdfjs\\catalogues') 
  
  //passsing directoryPath and callback function
  fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      } 
      //listing all files using forEach
      files.forEach(function (file) {
              
        if (file.endsWith('.pdf')) {
        
          // get file data
          let uuid = UUID()
          let fileName = file.replace('.pdf', '')
          let fileUrl = path.join(directoryPath, file);

          // get file text
          const pdfJsPromise = pdfjsLib.getDocument(fileUrl)

          pdfJsPromise.promise.then(function (doc) {

            const numPages = doc.numPages;

            console.log(`Got doc with ${numPages} pages... ${fileName}`);
            let pagesPromises = [];

            for (let i = 1; i <= doc.numPages; i++) {
              pagesPromises.push(getPageText(i, doc));
            }

            Promise.all(pagesPromises).then(function (pagesText) {
              // join text
              let fileText = pagesText.join(" ")

              if (fileText.length > 10) {
                  // console.log('theres text aight');
                  
                  // check if it exists in firestore
                  let found = false
                  db.collection('posts').where("fileUrl", "==", fileUrl).get().then(snapshot => {
                    snapshot.forEach((doc) => {
                      found = true
                      fireId = doc.id
                      caption = doc.caption
                      refreshTypesense(fireId, caption, fileUrl, fileText)
                      // console.log('Updating: ', fileName);
                    });
                  }).then(() => {
                    if (!found) {
                      // console.log('Creating: ', fileName,);
                      postToFirestore(uuid, fileName, fileUrl, fileText);
                    }
                  })
              }
              else {
                console.log(fileName, ' UNREADABLE. SKIPPED.');
              }
            });

                // Retrieves the text of a specif page within a PDF Document obtained through pdf.js
                function getPageText(pageNum, PDFDocumentInstance) {
                  // Return a Promise that is solved once the text of the page is retrieven
                  return new Promise(function (resolve, reject) {
                    PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
                      // The main trick to obtain the text of the PDF page, use the getTextContent method
                      pdfPage.getTextContent().then(function (content) {
                            
                        const strings = content.items.map(function (item) {
                          return item.str;
                        });
                        fileText = strings.join(" ")
                        // Solve promise with the text retrieven from the page
                        resolve(fileText);
                      });
                    });
                  });
                }
          }) //pdfJsPromise.promise.
          .catch(err => {
            console.log(err);
          });
        }        
      });
  });

   // refreshes data in typesense; meant for existing files
  function refreshTypesense(fireId, caption, fileUrl, fileText) {
    let document = {
      "id": fireId,
      "text": fileText,
      "fileUrl": fileUrl, 
      "caption": caption
    }
    TsenseClient.collections(Collection).documents(fireId).update(document)
      .catch(err => {
        console.log(err);
      });
  }

  // posts file to firestore and typesense; meant for newly found files
  function postToFirestore(uuid, caption, fileUrl, fileText) {

    db.collection('posts').doc(uuid).set({
      id: uuid,
      caption: caption,
      // convert to integer
      date: parseInt(Date.now()),
      fileUrl: fileUrl
    }).then(() => {
      // send text to typesense
      let document = {
        "id": uuid,
        "text": fileText,
        "fileUrl": fileUrl, 
        "caption": caption
      }
      TsenseClient.collections(Collection).documents().create(document)
        .catch(err => {
          console.log(err);
        });
    })  
  }

  console.log('Demonic djidja done.');
  response.send('I djidjed.')
})

/*
  endpoint - create posts from pdf files in a folder
*/
app.post('/pdf-test', (request, response) => {
  // response.set("Access-Control-Allow-Origin", "*")

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
      fileName = fields.fileName

      const pdfPath = process.argv[2] || fileUrl;

      const pdfJsPromise = pdfjsLib.getDocument(pdfPath);
      
      let allText = 'starts here'

      pdfJsPromise.promise.then(function (doc) {

        const numPages = doc.numPages;

        console.log(`Got doc with ${numPages} pages...`);
        console.log();

        let pagesPromises = [];

        for (let i = 0; i < doc.numPages; i++) {
            // Required to prevent that i is always the total of pages
            (function (pageNumber) {
                pagesPromises.push(getPageText(pageNumber, doc));
            })(i + 1);
        }

        Promise.all(pagesPromises).then(function (pagesText) {
          //pagesText.forEach(txt => console.log(txt))
          allText = pagesText.join(" ")
          console.log(allText);
        });

    /**
     * Retrieves the text of a specified page within a PDF Document obtained through pdf.js 
     * 
     **/
    function getPageText(pageNum, PDFDocumentInstance) {
        // Return a Promise that is solved once the text of the page is retrieven
        return new Promise(function (resolve, reject) {
            PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
                // The main trick to obtain the text of the PDF page, use the getTextContent method
                pdfPage.getTextContent().then(function (content) {
                  
                    const strings = content.items.map(function (item) {
                         return item.str;
                    });
                    fileText = strings.join(" ")
                    resolve(fileText);
                });
            });
        });
    }
      }) //t.promise.
      .catch(err => {
        console.log(err);
      });
    
    console.log('Done djidjing. Demonic powers compel you');
    response.send('I djidjed.')
  })
 
})





/*
  CODE STORE
*/
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
            TsenseClient.collections(Collection).documents().delete({ 'filter_by': `name : ${ post.id }` })
              // maybe batch this if it's only 1 document https://typesense.org/docs/0.22.2/api/documents.html#delete-a-single-document
              //client.collections('companies').documents().delete({'filter_by': 'num_employees:>100'})
             .then(() => {  
               console.log('post ' + post.id + ' deleted');
               return
             })
             .catch((error) => {
                console.log('post not deleted in TypeSense', error );
             });            
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





/*
  endpoint - create post with busboy and firestore
*/
app.post('/post-create', (request, response) => {
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
      
      pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${uuid}`
      
      // post fields to firestore
      db.collection('posts').doc(fields.id).set({
        id: fields.id,
        caption: fields.caption,
        // convert to integer
        date: parseInt(fields.date),
        fileUrl: pdfUrl
      }).then( () => {
        
        // index the document in typesense search
        fileUrl = pdfUrl
        fileName = fields.id
        fileDesc = fields.caption
        
          // extract PDF text
          const pdfPath = process.argv[2] || fileUrl;

          const pdfJsPromise = pdfjsLib.getDocument(pdfPath); 
        
          pdfJsPromise.promise.then(function (doc) {

            const numPages = doc.numPages;

            console.log(`Got doc with ${numPages} pages...`);
            // console.log();
            let pagesPromises = [];

            for (let i = 1; i <= doc.numPages; i++) {
                pagesPromises.push(getPageText(i, doc));
            }

            Promise.all(pagesPromises).then(function (pagesText) {
              // join text
              fileText = pagesText.join(" ")
              
              // send text to typesense
              let document = {
                "name": fileName,
                "text": fileText,
                "fileUrl": fileUrl, 
                "caption" : fileDesc
              }
              TsenseClient.collections(Collection).documents().create(document)
                .then(function () { 
                  console.log('Done Parsing form and inserting to dbases. Demonic powers compel you.');
                })
                .catch(err => {
                  console.log(err);
                });
            });

                // Retrieves the text of a specif page within a PDF Document obtained through pdf.js
                function getPageText(pageNum, PDFDocumentInstance) {
                  // Return a Promise that is solved once the text of the page is retrieven
                  return new Promise(function (resolve, reject) {
                    PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
                      // The main trick to obtain the text of the PDF page, use the getTextContent method
                      pdfPage.getTextContent().then(function (content) {
                            
                        const strings = content.items.map(function (item) {
                          return item.str;
                        });
                        fileText = strings.join(" ")
                        // Solve promise with the text retrieven from the page
                        resolve(fileText);
                      });
                    });
                  });
                }

            return response.send('Post added: ' + fields.id)
          }) //pdfJsPromise.promise.
          .catch(err => {
            console.log(err);
          });
      })
    }

  });
  // actually run busboy
  request.pipe(bb);
})


/*
  endpoint - create post PAGE BY PAGE
*/
// app.post('/posts-create', (request, response) => {
//   response.set("Access-Control-Allow-Origin", "*")

//   // create an uuid for this
//   let uuid = UUID()

//   // process response containing the form data via busboy
//   const bb = busboy({ headers: request.headers });

  
//   let fields = {}
//   let fileData = {}

//   let pdfFile = {}
//   let pdfUrl = ''

//     //on-file hook do this for every file
//   bb.on('file', (name, file, info) => {
//     const { filename, encoding, mimeType } = info;
//     console.log(
//       `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
//       filename,
//       encoding,
//       mimeType
//     );
//     // write the file to the tmp folder on the server
//     // gets the filepath by joining the tmpdir() path from the os package and the filename
//     let filepath = path.join(os.tmpdir(), filename)
//     // creates a writestream with the assigned filepath and writes it to the tmp folder
//     file.pipe(fs.createWriteStream(filepath))
//     // writes required stuff into a fileData object
//     fileData = { filepath, mimeType }
//     // pdfFile = file
//     file.on("data", (data) => {
//       // ... and write the file's name, type and content into `fields`.
//       pdfFile = data
//       // console.log('pdfFile', pdfFile);
//     });
//   });

//   //on-field hook - do this for every field
//   bb.on('field', (name, val, info) => {
//     fields[name] = val
//   });

//   // runs this when it's done processing all the data
//   // here is where you actually insert stuff into the firestore db
//   bb.on('close', () => {
//     console.log('fields: ', fields);

//     // upload the file from the tmp folder on the server into the firestore storage bucket
//     bucket.upload(
//       fileData.filepath, 
//       {
//         uploadType: 'media',
//         metadata: {
//           metadata: {
//             contentType: fileData.mimeType,
//             firebaseStorageDownloadTokens: uuid
//           }
//         },
//       },
//       (err, uploadedFile) => {
//         if (!err) {
//           createFile(uploadedFile)
//         }
//         else 
//           console.log(err);
//       }
//     )
//     // creates a file and post on firebase
//     function createFile(uploadedFile) {
      
//       pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${ bucket.name }/o/${ uploadedFile.name }?alt=media&token=${ uuid }`

//       //  for PDF detection
//                     // send to algolia
//                     // const re = /(?:\.([^.]+))?$/;
//                     // const ext = re.exec(fileName);

//       // post fields to firestore
//       db.collection('posts').doc(fields.id).set({
//         id: fields.id,
//         caption: fields.caption,
//         location: fields.location,
//         // convert to integer
//         date: parseInt(fields.date),
//         fileUrl: pdfUrl
//       }).then( () => {
        
//         // index the document in typesense search
//         fileUrl = pdfUrl
//         fileName = fields.id
//         fileDesc = fields.caption
        
//           // extract PDF text
//           const pdfPath = process.argv[2] || fileUrl;
//           //const pdfPath = fileUrl;
//           console.log('pdfpath, ', pdfPath);

//           const pdfJsPromise = pdfjsLib.getDocument(pdfPath); 
        
//           pdfJsPromise.promise.then(function (doc) {

//             const numPages = doc.numPages;

//             console.log(`Got doc with ${numPages} pages...`);
//             // console.log();

//             let lastPromise; // will be used to chain promises
//             lastPromise = doc.getMetadata().then(function (data) {
//               if (data.metadata) {
//               }
//             });

//             const loadPage = function (pageNumber) {
//               return doc.getPage(pageNumber).then(function (page) {
//                 // console.log("# Page " + pageNumber);
//                 const viewport = page.getViewport({ scale: 1.0 });
//                 return page
//                   .getTextContent()
//                   .then(function (content) {
//                     // Content contains lots of information about the text layout and
//                     // styles, but we need only strings at the moment
//                     const strings = content.items.map(function (item) {
//                       return item.str;
//                     });
//                     // console.log("## Text Content");
//                     fileText = strings.join(" ")
//                     console.log(fileText);

//                    // send text to typesense
//                     let document = {
//                       "name": fileName,
//                       "text": fileText,
//                       "fileUrl": fileUrl, 
//                       "description" : fileDesc
//                     }
//                     TsenseClient.collections(Collection).documents().create(document)
//                     // Release page resources.
//                     page.cleanup();
//                   })
//                   .then(function () {
//                     console.log('Done parsing form. Demonic powers compel you');
                    
//                   })
//                   .catch(err => {
//                   console.log(err);
//                   });
//               });
//             };
//             // Loading of the first page will wait on metadata and subsequent loadings
//             // will wait on the previous pages.
//             for (let i = 1; i <= numPages; i++) {
//               lastPromise = lastPromise.then(loadPage.bind(null, i));
//             }
//             response.send('Post added: ' + fields.id)
//           }) //pdfJsPromise.promise.
//           .catch(err => {
//             console.log(err);
//           });
//       })
//     }
//     console.log('Done parsing form. Demonic powers compel you');
//   });
//   // actually run busboy
//   request.pipe(bb);
// })
