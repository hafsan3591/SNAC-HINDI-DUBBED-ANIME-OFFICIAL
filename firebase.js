// firebase.js — SNAC ANIME Firebase Connection

const firebaseConfig = {
  apiKey: "AIzaSyB-aYZJXzNR8-dXU3C0ySMYUzPV6mP_IrU",
  authDomain: "snac-hindi-dubbed-anime.firebaseapp.com",
  projectId: "snac-hindi-dubbed-anime",
  storageBucket: "snac-hindi-dubbed-anime.firebasestorage.app",
  messagingSenderId: "142861232946",
  appId: "1:142861232946:web:46f67e4ed601ade0bf452b",
  measurementId: "G-XRGR7KMGM"
};

let _db = null;
let _fbReady = false;

async function initFirebase() {
  if (_fbReady) return _db;
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    _db = getFirestore(app);
    _fbReady = true;
    return _db;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return null;
  }
}

async function fbGetAllAnime() {
  const db = await initFirebase();
  if (!db) return [];
  try {
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDocs(collection(db, "anime"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Firebase read failed:", e);
    return [];
  }
}

async function fbSaveAnime(anime) {
  const db = await initFirebase();
  if (!db) throw new Error("Firebase not ready");
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await setDoc(doc(db, "anime", anime.id), anime);
  return true;
}

async function fbDeleteAnime(id) {
  const db = await initFirebase();
  if (!db) throw new Error("Firebase not ready");
  const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await deleteDoc(doc(db, "anime", id));
  return true;
}

window.SNAC_FB = { fbGetAllAnime, fbSaveAnime, fbDeleteAnime, initFirebase };