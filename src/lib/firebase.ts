// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGUmblMEO6DGAHavQtGZNmQw5Il58mMps",
  authDomain: "expressify-777.firebaseapp.com",
  databaseURL: "https://expressify-777-default-rtdb.firebaseio.com",
  projectId: "expressify-777",
  storageBucket: "expressify-777.firebasestorage.app",
  messagingSenderId: "65297036289",
  appId: "1:65297036289:web:6eda2d144fd09cc499fc00",
  measurementId: "G-MEYWD9HRCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const database = getDatabase(app);

export { app, analytics, auth, database };