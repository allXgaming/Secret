import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjfdpYY-CxlownFnN18S6eSVRX4z4Vitg",
  authDomain: "code-canopy-pem7a.firebaseapp.com",
  databaseURL: "https://code-canopy-pem7a-default-rtdb.firebaseio.com",
  projectId: "code-canopy-pem7a",
  storageBucket: "code-canopy-pem7a.firebasestorage.app",
  messagingSenderId: "1069303364679",
  appId: "1:1069303364679:web:860381c722feda8c4cc562"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };