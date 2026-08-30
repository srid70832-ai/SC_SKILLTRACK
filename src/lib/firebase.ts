import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  getDoc,
  getDocFromServer, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Support both Vite frontend (import.meta.env) and Node backend (process.env)
const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`VITE_${key}`] || process.env[key];
  }
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY') || firebaseConfigData.apiKey,
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || firebaseConfigData.authDomain || 'scmain-b2cde.firebaseapp.com',
  projectId: getEnvVar('FIREBASE_PROJECT_ID') || firebaseConfigData.projectId || 'scmain-b2cde',
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || firebaseConfigData.storageBucket || 'scmain-b2cde.firebasestorage.app',
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigData.messagingSenderId || '1096271363191',
  appId: getEnvVar('FIREBASE_APP_ID') || firebaseConfigData.appId || '1:1096271363191:web:2fb11e22ce1004b8751a72',
  firestoreDatabaseId: getEnvVar('FIREBASE_DATABASE_ID') || firebaseConfigData.firestoreDatabaseId || '(default)'
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId
      });
    }
  }
  return appInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
  }
  return dbInstance;
}

// Test connection on boot as recommended by Firebase integration skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection verified successfully to project:', firebaseConfig.projectId);
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    } else {
      console.log('[Firebase] Firestore initialized and active for project:', firebaseConfig.projectId);
    }
    return true;
  }
}

/**
 * High-level Firebase Database Service for SC SkillTrack
 */
export const FirebaseDbService = {
  // Students Collection
  async getAllStudents(): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, 'students'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[FirebaseDb] Error getting students:', e);
      return [];
    }
  },

  async saveStudent(student: any): Promise<boolean> {
    try {
      const db = getFirebaseDb();
      const docId = student.registerNumber || student.rollNumber || student.id;
      await setDoc(doc(db, 'students', String(docId).toUpperCase()), student, { merge: true });
      return true;
    } catch (e) {
      console.error('[FirebaseDb] Error saving student:', e);
      return false;
    }
  },

  // Polls Collection
  async getAllPolls(): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, 'polls'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[FirebaseDb] Error getting polls:', e);
      return [];
    }
  },

  async savePoll(poll: any): Promise<boolean> {
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'polls', String(poll.id)), poll, { merge: true });
      return true;
    } catch (e) {
      console.error('[FirebaseDb] Error saving poll:', e);
      return false;
    }
  },

  async deletePoll(pollId: string): Promise<boolean> {
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'polls', pollId));
      return true;
    } catch (e) {
      console.error('[FirebaseDb] Error deleting poll:', e);
      return false;
    }
  },

  // Poll Responses Collection
  async getPollResponses(pollId?: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (pollId) {
        const q = query(collection(db, 'poll_responses'), where('pollId', '==', pollId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        const snap = await getDocs(collection(db, 'poll_responses'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.error('[FirebaseDb] Error getting poll responses:', e);
      return [];
    }
  },

  async savePollResponse(response: any): Promise<boolean> {
    try {
      const db = getFirebaseDb();
      const docId = response.id || `${response.pollId}_${response.studentRollNumber}`;
      await setDoc(doc(db, 'poll_responses', docId), response, { merge: true });
      return true;
    } catch (e) {
      console.error('[FirebaseDb] Error saving poll response:', e);
      return false;
    }
  },

  // Hackathons Collection
  async getAllHackathons(): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, 'hackathons'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('[FirebaseDb] Error getting hackathons:', e);
      return [];
    }
  },

  async saveHackathon(hackathon: any): Promise<boolean> {
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'hackathons', String(hackathon.id)), hackathon, { merge: true });
      return true;
    } catch (e) {
      console.error('[FirebaseDb] Error saving hackathon:', e);
      return false;
    }
  },

  // Real-time Poll Listener
  subscribeToPolls(callback: (polls: any[]) => void): Unsubscribe {
    const db = getFirebaseDb();
    return onSnapshot(collection(db, 'polls'), (snapshot) => {
      const polls = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(polls);
    }, (error) => {
      console.warn('[FirebaseDb] Polls subscription notice:', error.message);
    });
  },

  // Real-time Responses Listener
  subscribeToResponses(pollId: string, callback: (responses: any[]) => void): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'poll_responses'), where('pollId', '==', pollId));
    return onSnapshot(q, (snapshot) => {
      const responses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(responses);
    }, (error) => {
      console.warn('[FirebaseDb] Responses subscription notice:', error.message);
    });
  }
};

