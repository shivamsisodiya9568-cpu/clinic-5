// Firebase config for RK Dental Clinic
// This file connects your HTML/CSS/JS website to Firebase.

const firebaseConfig = {
  apiKey: "AIzaSyDHuLXwe3Bcb7VgOUhg9cXzgul4qqZhVV0",
  authDomain: "dental-clinic-94bb2.firebaseapp.com",
  projectId: "dental-clinic-94bb2",
  storageBucket: "dental-clinic-94bb2.firebasestorage.app",
  messagingSenderId: "964189142911",
  appId: "1:964189142911:web:81489eee12937f3d49644a",
  measurementId: "G-5BRYPSQBS4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
