// system.js – imports system modules and sets up auth observer
import { auth, db } from '../api/firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showApp, showLoginPage } from './app.js';
import '../system/auth.js';
import '../system/setting.js';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentUser = user;
        // Update lastLogin
        try {
            await updateDoc(doc(db, "users", user.uid), { lastLogin: new Date() });
        } catch (e) {}
        showApp();
    } else {
        showLoginPage();
    }
});