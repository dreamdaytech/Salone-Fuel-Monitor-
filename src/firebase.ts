import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, linkWithPhoneNumber } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence, doc, getDoc, getDocs, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, orderBy, limit, getDocFromServer, terminate, writeBatch, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Use initializeFirestore with auto long-polling for better reliability in sandboxed/proxy environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firebase offline persistence enabled');
    })
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firebase offline persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('Firebase offline persistence failed: Browser not supported');
      }
    });
}

// Initialize Messaging conditionally (only in browser)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Connection test to help diagnose configuration issues
async function testConnection() {
  try {
    console.log("Testing Firestore connection with config:", {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      authDomain: firebaseConfig.authDomain
    });
    
    // Try to obtain a document metadata from server to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection test: Reachable (backend successfully responded).");
  } catch (error: any) {
    console.warn("Firestore connection test result:", error.code || error.message);
    if (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('unavailable')) {
      console.warn("Could not reach Firestore backend during startup test. Firestore will operate in offline/cache mode until a stable connection is established.");
    }
  }
}
testConnection();

export {
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  signInWithRedirect,
  getRedirectResult,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
  getDocFromServer,
  getToken,
  onMessage,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
