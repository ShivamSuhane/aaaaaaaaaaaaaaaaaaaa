import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAzoe08f1B5WxYsEnK0vajjGNofmV2phJg",
  authDomain: "mantra-meter.firebaseapp.com",
  projectId: "mantra-meter",
  storageBucket: "mantra-meter.firebasestorage.app",
  messagingSenderId: "33866769980",
  appId: "1:33866769980:web:869c1ff90f6b34298bc539"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Google Sign In
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLogin: serverTimestamp(),
    }, { merge: true });

    return user;
  } catch (error: any) {
    // If popup blocked, try redirect
    if (error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

// Sign Out
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

// Auth State Listener
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Save mantras to Firestore
export async function saveMantrasToCloud(userId: string, mantras: any[]) {
  try {
    await setDoc(doc(db, 'users', userId, 'appData', 'mantras'), {
      mantras: JSON.stringify(mantras),
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
}

// Load mantras from Firestore
export async function loadMantrasFromCloud(userId: string): Promise<any[] | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'appData', 'mantras'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return JSON.parse(data.mantras);
    }
    return null;
  } catch (error) {
    console.error('Error loading from cloud:', error);
    return null;
  }
}

// Save settings to Firestore
export async function saveSettingsToCloud(userId: string, settings: any) {
  try {
    await setDoc(doc(db, 'users', userId, 'appData', 'settings'), {
      ...settings,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Load settings from Firestore
export async function loadSettingsFromCloud(userId: string): Promise<any | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId, 'appData', 'settings'));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
}

export { auth, db };