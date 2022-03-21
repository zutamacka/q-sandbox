// Import the functions you need from the SDKs you need
// import { initializeApp } from 'firebase/app'

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries
// import { getStorage } from 'firebase/storage'
// import { getFirestore } from 'firebase/firestore'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
//import { firebaseConfig } from './firebase-cred.js'

const firebaseConfig = {
  apiKey: 'AIzaSyD1-UmfGuFkRH07Qt-mg2eHPMnKVshd7OY',
  authDomain: 'qsandbox-a5214.firebaseapp.com',
  projectId: 'qsandbox-a5214',
  storageBucket: 'qsandbox-a5214.appspot.com',
  messagingSenderId: '361424713547',
  appId: '1:361424713547:web:37d791dc2964b3f3e2dace'
};

// Your web app's Firebase configuration
const firebaseApp = firebase.initializeApp(firebaseConfig)
export const fireDB = firebaseApp.firestore()
// Initialize Firebase
// export const fireApp = initializeApp(firebaseConfig)
// export const fireDB = getFirestore()

//https://www.positronx.io/vue-js-firebase-build-vue-crud-app-with-cloud-firestore/
