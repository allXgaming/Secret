// app.js – imports all page modules (UI logic)
import '../page/chat.js';
import '../page/home.js';
import '../page/polls.js';
import '../page/profile.js';
import '../page/watchlist.js';

import { loadDetailsPage, searchAnime } from '../api/jikan.js';
import { auth, db } from '../api/firebase.js';
import { doc, setDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { closeModal, openModal } from '../api/utils.js';

// Import page functions
import { loadHomePage, changePage, switchHomeTab } from '../page/home.js';
import { loadWatchlist, filterList, updateEp, openDeleteModal, confirmDelete, openRateModal, saveRating } from '../page/watchlist.js';
import { loadPolls, votePoll, createPoll, addOptionField } from '../page/polls.js';
import { loadChatPage, searchUser, createGroup, switchTab, handleFab, openGroupSettings, saveGroupInfo, updateGroupPhoto, updateGroupSetting, toggleGroupMute, promoteMember, demoteMember, kickMember, acceptRequest, rejectRequest, exitGroup, closeChat, sendMessage } from '../page/chat.js';
import { loadProfilePage, uploadBanner, openEditModal, saveProfile, copyId } from '../page/profile.js';

// Global state (preserved from original main.js)
window.currentUser = null;
window.currentPage = 'home';
window.allAnime = []; // used by watchlist
let presenceInterval = null;

// Navigation
window.navigateTo = function(page, params = {}) {
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav && nav.classList) nav.classList.remove('active');
    });
    
    window.currentPage = page;
    const newPage = document.getElementById(page + 'Page');
    
    if (newPage) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        newPage.classList.add('active');
        
        updateHeader(page);
        const navItem = document.getElementById('nav' + page.charAt(0).toUpperCase() + page.slice(1));
        if (navItem && navItem.classList) navItem.classList.add('active');
        loadPageContent(page, params);
    }
};

function updateHeader(page) {
    const headerTitle = document.getElementById('headerTitle');
    const headerActions = document.getElementById('headerActions');
    headerActions.innerHTML = '';
    
    switch(page) {
        case 'home':
            headerTitle.textContent = 'AnimeExplorer';
            break;
        case 'watchlist':
            headerTitle.textContent = 'My List';
            break;
        case 'poll':
            headerTitle.textContent = 'Community Polls';
            headerActions.innerHTML = `<button class="header-btn btn-pulse" id="headerCreatePollBtn" style="color:white; background:var(--primary); padding:6px 18px; border-radius:30px; font-size:12px; font-weight:700; box-shadow:0 4px 10px rgba(124, 77, 255, 0.3);"><i class="fa-solid fa-plus"></i> New</button>`;
            setTimeout(() => {
                const pollBtn = document.getElementById('headerCreatePollBtn');
                if (pollBtn) pollBtn.addEventListener('click', () => openModal('createPollModal'));
            }, 100);
            break;
        case 'chat':
            headerTitle.textContent = 'Messages';
            break;
        case 'profile':
            headerTitle.textContent = 'Profile';
            break;
        case 'details':
            headerTitle.textContent = 'Anime Details';
            break;
    }
}

function loadPageContent(page, params) {
    switch(page) {
        case 'home': loadHomePage(); break;
        case 'watchlist': loadWatchlist(); break;
        case 'poll': loadPolls(); break;
        case 'chat': loadChatPage(); break;
        case 'profile': loadProfilePage(params.uid); break;
        case 'details': loadDetailsPage(params.id); break;
    }
}

// Presence System
function startPresenceSystem() {
    if(!window.currentUser) return;
    const update = () => {
        if(window.currentUser) {
            updateDoc(doc(db, "users", window.currentUser.uid), { lastLogin: serverTimestamp() });
        }
    };
    update();
    if(presenceInterval) clearInterval(presenceInterval);
    presenceInterval = setInterval(update, 60000);
}

// Functions to be called from system.js
export function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    startPresenceSystem();
    navigateTo('home');
}

export function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    switchToLoginMode();
}

// Add to watchlist (used in details page)
window.addToWatchlist = async function() {
    if (!window.currentUser) return alert("Please Login First!");
    const btn = document.getElementById('addBtn');
    const status = document.getElementById('statusSelect').value;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try {
        await setDoc(doc(db, "users", window.currentUser.uid, "watchlist", String(window.currentAnime.mal_id)), {
            id: window.currentAnime.mal_id,
            title: window.currentAnime.title_english || window.currentAnime.title,
            image: window.currentAnime.images.jpg.image_url,
            totalEpisodes: window.currentAnime.episodes || 0,
            watchedEpisodes: 0,
            userScore: 0,
            status: status,
            addedAt: new Date()
        }, { merge: true });
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add'; }, 2000);
    } catch (e) {
        alert("Error");
    }
};

// DOM event listeners (copied from original main.js DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners
    document.getElementById('emailSubmitBtn').addEventListener('click', handleEmailAuth);
    document.getElementById('toggleFormLink').addEventListener('click', (e) => {
        e.preventDefault();
        if (document.getElementById('emailForm').classList.contains('signup-mode')) {
            switchToLoginMode();
        } else {
            switchToSignupMode();
        }
    });
    
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('forgotPasswordModal');
    });

    document.getElementById('sendResetBtn').addEventListener('click', async () => {
        const email = document.getElementById('resetEmailInput').value.trim();
        if(!email) return alert("Please enter email");
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent!");
            closeModal('forgotPasswordModal');
        } catch(e) {
            alert(e.message);
        }
    });
    document.getElementById('closeResetModalBtn').addEventListener('click', () => closeModal('forgotPasswordModal'));

    // Navigation
    document.getElementById('navHome').addEventListener('click', () => navigateTo('home'));
    document.getElementById('navWatchlist').addEventListener('click', () => navigateTo('watchlist'));
    document.getElementById('navPoll').addEventListener('click', () => navigateTo('poll'));
    document.getElementById('navChat').addEventListener('click', () => navigateTo('chat'));
    document.getElementById('navProfile').addEventListener('click', () => navigateTo('profile'));
    
    document.getElementById('backButton').addEventListener('click', () => navigateTo('home'));
    
    // Profile
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
    document.getElementById('editProfileMenuBtn').addEventListener('click', openEditModal);
    document.getElementById('copyIdBtn').addEventListener('click', copyId);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Chat tabs
    document.getElementById('tab-private').addEventListener('click', () => switchTab('private'));
    document.getElementById('tab-groups').addEventListener('click', () => switchTab('groups'));
    document.getElementById('fabButton').addEventListener('click', handleFab);
    
    // Modal close buttons
    document.getElementById('closeSearchModalBtn').addEventListener('click', () => closeModal('searchModal'));
    document.getElementById('closeGroupModalBtn').addEventListener('click', () => closeModal('createGroupModal'));
    document.getElementById('closeGroupSettingsBtn').addEventListener('click', () => closeModal('groupSettingsModal'));
    document.getElementById('closePollModalBtn').addEventListener('click', () => closeModal('createPollModal'));
    document.getElementById('closeRateModalBtn').addEventListener('click', () => closeModal('rateModal'));
    document.getElementById('closeDeleteModalBtn').addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('closeEditProfileModalBtn').addEventListener('click', () => closeModal('editProfileModal'));
    
    // Search and create
    document.getElementById('searchUserBtn').addEventListener('click', searchUser);
    document.getElementById('createGroupBtn').addEventListener('click', createGroup);
    document.getElementById('addOptionBtn').addEventListener('click', addOptionField);
    document.getElementById('createPollBtn').addEventListener('click', createPoll);
    document.getElementById('saveRatingBtn').addEventListener('click', saveRating);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    // Chat close
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    
    // Chat header click
    document.getElementById('chatHeaderInfo').addEventListener('click', () => {
        if(window.activeChatType === 'group' && window.activeChatId) {
            openGroupSettings();
        } else if(window.activeChatType === 'private' && window.activeChatTargetUid) {
            const targetUid = window.activeChatTargetUid; 
            closeChat();
            navigateTo('profile', { uid: targetUid }); 
        }
    });
    
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('msgInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Banner upload
    document.getElementById('editBannerBtn').addEventListener('click', () => document.getElementById('bannerUpload').click());
    document.getElementById('bannerUpload').addEventListener('change', uploadBanner);
    
    // Watchlist filter buttons
    document.querySelectorAll('#watchlistPage .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterList(filter, this);
        });
    });

    // Home pagination and search
    document.getElementById('prevPageBtn').addEventListener('click', () => changePage('prev'));
    document.getElementById('nextPageBtn').addEventListener('click', () => changePage('next'));
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            const query = e.target.value.trim();
            if(query) {
                window.currentHomePageNum = 1;
                searchAnime(query, 1);
            }
        }
    });
});

// Expose some variables for other modules
window.currentHomePageNum = 1;
window.activeChatId = null;
window.activeChatType = 'private';
window.activeChatTargetUid = null;