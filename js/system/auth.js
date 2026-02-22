import { auth, db } from '../api/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { uploadImage } from '../api/utils.js';

let isLoginMode = true;

export function switchToLoginMode() {
    isLoginMode = true;
    document.getElementById('formTitle').textContent = 'Welcome Back!';
    document.getElementById('formSubtitle').textContent = 'Sign in to sync your watchlist and chat.';
    document.getElementById('emailSubmitBtn').textContent = 'Sign In';
    
    document.getElementById('toggleText').textContent = "Don't have an account?";
    document.getElementById('toggleFormLink').textContent = 'Sign Up';
    
    document.getElementById('emailForm').classList.remove('signup-mode');
    
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('errorMessage').classList.add('hidden');
}

export function switchToSignupMode() {
    isLoginMode = false;
    document.getElementById('formTitle').textContent = 'Create Account';
    document.getElementById('formSubtitle').textContent = 'Join AnimeExplorer community today!';
    document.getElementById('emailSubmitBtn').textContent = 'Sign Up';
    
    document.getElementById('toggleText').textContent = "I have an account?";
    document.getElementById('toggleFormLink').textContent = 'Sign In';
    
    document.getElementById('emailForm').classList.add('signup-mode');
    
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupPhoto').value = '';
    document.getElementById('errorMessage').classList.add('hidden');
}

export async function handleEmailAuth() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    if (!email || !password || password.length < 6) {
        errorMessage.textContent = 'Invalid credentials (min 6 chars)';
        errorMessage.classList.remove('hidden');
        return;
    }
    errorMessage.classList.add('hidden');

    const btn = document.getElementById('emailSubmitBtn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            // Signup Logic
            const name = document.getElementById('signupName').value.trim();
            const username = document.getElementById('signupUsername').value.trim();
            const photoFile = document.getElementById('signupPhoto').files[0];

            if(!name || !username) {
                throw new Error("All fields required");
            }

            // Check Username Uniqueness
            const q = query(collection(db, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error("Username already taken.");
            }

            // Upload Photo if exists
            let photoURL = null;
            if(photoFile) {
                photoURL = await uploadImage(photoFile);
            }

            // Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save User with details
            await saveUser(user, username, name, photoURL);
        }
    } catch (error) {
        errorMessage.textContent = error.message; 
        errorMessage.classList.remove('hidden');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function saveUser(user, username, displayName, photoURL) {
    const userRef = doc(db, "users", user.uid);
    
    let customId = "0000000000";
    try {
        customId = await runTransaction(db, async (transaction) => {
            const counterRef = doc(db, "settings", "userCounter");
            const counterDoc = await transaction.get(counterRef);
            let nextId = 0;
            if (counterDoc.exists()) {
                nextId = counterDoc.data().lastId + 1;
            }
            transaction.set(counterRef, { lastId: nextId });
            return String(nextId).padStart(10, '0');
        });
    } catch (e) { 
        customId = Math.floor(Math.random() * 1000000000).toString().padStart(10, '0');
    }

    const finalAvatar = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=7c4dff&color=fff`;

    await setDoc(userRef, {
        uid: user.uid,
        customId: customId,
        username: username,
        displayName: displayName || username,
        email: user.email,
        avatar: finalAvatar,
        banner: "",
        bio: "Hey there!",
        followers: [],
        following: [],
        likes: [],
        dislikes: [],
        isVerified: false,
        createdAt: new Date(),
        lastLogin: new Date()
    });
}

export async function handleLogout() {
    if(confirm("Are you sure?")) await signOut(auth);
}

// Attach to window for inline event handlers
window.switchToLoginMode = switchToLoginMode;
window.switchToSignupMode = switchToSignupMode;
window.handleEmailAuth = handleEmailAuth;
window.handleLogout = handleLogout;
