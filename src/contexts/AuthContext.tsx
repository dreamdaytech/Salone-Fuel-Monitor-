import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, linkWithPhoneNumber, doc, getDoc, setDoc, updateDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, ConfirmationResult } from 'firebase/auth';
import { toast } from 'sonner';
import firebaseConfig from '../../firebase-applet-config.json';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'station_owner' | 'user';
  createdAt: any;
  avatarUrl?: string;
  optInAlerts?: boolean;
  optInSms?: boolean;
  phoneNumber?: string;
  alertDistricts?: string[];
  alertFuelTypes?: string[];
  priceThresholds?: Record<string, number>;
  fcmToken?: string;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult | null>;
  setupRecaptcha: (containerId: string) => Promise<void>;
  recaptchaSolved: boolean;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  linkPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult | null>;
  verifyAndLinkPhone: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  logOut: () => Promise<void>;
  completeRegistration: (name: string, role: 'user' | 'station_owner', phoneNumber?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithPhone: async () => null,
  setupRecaptcha: async () => {},
  recaptchaSolved: false,
  verifyOtp: async () => {},
  linkPhone: async () => null,
  verifyAndLinkPhone: async () => {},
  logOut: async () => {},
  completeRegistration: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email || currentUser?.phoneNumber, currentUser?.uid);
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          console.log("Fetching profile for:", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            console.log("Profile found:", data.role);
            const isDefaultAdmin = currentUser.email?.toLowerCase() === 'kharifakumara16@gmail.com' || currentUser.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com' || currentUser.email?.toLowerCase() === 'slfuelmonitor@gmail.com';
            
            if (isDefaultAdmin && data.role !== 'admin') {
              console.log("Upgrading default admin to admin role...");
              const updates = { role: 'admin' as const };
              await updateDoc(userDocRef, updates);
              setProfile({ ...data, ...updates });
            } else {
              setProfile(data);
            }
          } else {
            console.log("No profile found in Firestore.");
            // Check if this is the default admin
            const isDefaultAdmin = currentUser.email?.toLowerCase() === 'kharifakumara16@gmail.com' || currentUser.email?.toLowerCase() === 'kharifaabdulaikumara1@gmail.com' || currentUser.email?.toLowerCase() === 'slfuelmonitor@gmail.com';
            if (isDefaultAdmin) {
              console.log("Creating default admin profile...");
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                name: currentUser.displayName || 'Admin',
                role: 'admin',
                createdAt: serverTimestamp(),
                onboardingCompleted: true,
              };
              try {
                await setDoc(userDocRef, newProfile);
                console.log("Default admin profile created successfully.");
                setProfile(newProfile);
              } catch (err) {
                console.error("Failed to create default admin profile:", err);
                setProfile(newProfile);
              }
            } else {
              console.log("User needs to register.");
              setProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching or creating user profile:", error);
          try {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          } catch (e) {}
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [recaptchaSolved, setRecaptchaSolved] = useState(false);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Sign-in popup request was cancelled (likely a duplicate request).');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('The sign-in window was closed before completion. Please try again.');
      } else {
        console.error('Error signing in:', error);
        setAuthError('An error occurred during sign-in. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError('An error occurred during sign-in. Please try again.');
      }
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Password should be at least 6 characters.');
      } else {
        setAuthError('An error occurred during sign-up. Please try again.');
      }
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const setupRecaptcha = async (containerId: string) => {
    console.log('Setting up reCAPTCHA in container:', containerId);
    setRecaptchaSolved(false);
    
    // Check if the container element exists in the DOM to prevent auth/argument-error
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`reCAPTCHA container with id "${containerId}" not found in DOM. Skipping setup.`);
      return;
    }

    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing existing recaptcha:', e);
        }
      }

      const verifier = new RecaptchaVerifier(auth, container, {
        size: 'normal',
        callback: (response: any) => {
          console.log('reCAPTCHA solved successfully', response);
          setRecaptchaSolved(true);
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
          setRecaptchaSolved(false);
          toast.error('reCAPTCHA expired. Please solve it again.');
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          setRecaptchaSolved(false);
        }
      });

      (window as any).recaptchaVerifier = verifier;
      await verifier.render();
      console.log('reCAPTCHA rendered successfully');
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    setAuthError(null);
    console.log('Starting phone sign-in for:', phoneNumber);
    try {
      let verifier = (window as any).recaptchaVerifier;
      
      if (!verifier) {
        console.log('No verifier found, setting up now...');
        await setupRecaptcha(recaptchaContainerId);
        verifier = (window as any).recaptchaVerifier;
      }

      if (!recaptchaSolved) {
        toast.error('Please solve the reCAPTCHA first.');
        return null;
      }
      
      console.log('Calling signInWithPhoneNumber...');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      console.log('OTP sent successfully');
      return confirmationResult;
    } catch (error: any) {
      console.error('DETAILED Phone Auth Error:', error);
      console.dir(error);
      
      const errorCode = error.code;
      const errorMessage = error.message;
      
      if (errorCode === 'auth/operation-not-allowed') {
        if (errorMessage.toLowerCase().includes('region')) {
          setAuthError(`SMS region policy blocked this number. Please go to Firebase Console > Authentication > Settings > SMS region policy and allow your country/region.`);
        } else {
          setAuthError(`Phone authentication is not enabled for project "${firebaseConfig.projectId}". Please double-check the "Sign-in method" tab in the Firebase Console for THIS specific project ID.`);
        }
      } else if (errorCode === 'auth/network-request-failed') {
        setAuthError('Network error. This often happens if the domain is not in the "Authorized domains" list in Firebase Auth settings.');
      } else if (errorCode === 'auth/invalid-phone-number') {
        setAuthError('Invalid phone number format. Please use E.164 format (e.g., +23276111668).');
      } else if (errorCode === 'auth/too-many-requests') {
        setAuthError('Too many requests. Firebase has temporarily blocked this number or IP due to unusual activity.');
      } else {
        setAuthError(`Error (${errorCode}): ${errorMessage}`);
      }
      
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
      }
      return null;
    }
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await confirmationResult.confirm(otp);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setAuthError('Invalid verification code.');
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const linkPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    if (!user) return null;
    setAuthError(null);
    try {
      let verifier = (window as any).recaptchaVerifier;
      if (!verifier) {
        await setupRecaptcha(recaptchaContainerId);
        verifier = (window as any).recaptchaVerifier;
      }
      
      if (!recaptchaSolved) {
        toast.error('Please solve the reCAPTCHA first.');
        return null;
      }

      const confirmationResult = await linkWithPhoneNumber(user, phoneNumber, verifier);
      return confirmationResult;
    } catch (error: any) {
      console.error('Error linking phone:', error);
      if (error.code === 'auth/billing-not-enabled') {
        setAuthError('Phone authentication requires billing to be enabled in the Firebase Console.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setAuthError('The phone number is invalid.');
      } else if (error.code === 'auth/credential-already-in-use') {
        setAuthError('This phone number is already linked to another account.');
      } else {
        setAuthError('Failed to send verification code.');
      }
      throw error;
    }
  };

  const verifyAndLinkPhone = async (confirmationResult: ConfirmationResult, otp: string) => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      const linkedUser = result.user;
      
      if (profile) {
        const userDocRef = doc(db, 'users', linkedUser.uid);
        const updates: any = {};
        if (linkedUser.phoneNumber) {
          updates.phoneNumber = linkedUser.phoneNumber;
        }
        // Use updateDoc instead of setDoc with merge for better security rule compatibility
        if (Object.keys(updates).length > 0) {
          await updateDoc(userDocRef, updates);
          setProfile({ ...profile, ...updates });
        }
      }
      
      toast.success('Phone number verified and linked to your account!');
    } catch (error: any) {
      console.error('Error verifying and linking phone:', error);
      if (error.code === 'auth/credential-already-in-use') {
        setAuthError('This phone number is already linked to another account.');
      } else {
        setAuthError('Invalid verification code.');
      }
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const completeRegistration = async (name: string, role: 'user' | 'station_owner', phoneNumber?: string) => {
    if (!user) {
      console.error("Cannot complete registration: No user authenticated");
      return;
    }
    
    console.log("Completing registration for:", user.uid, { name, role, phoneNumber });
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const newProfile: any = {
        uid: user.uid,
        email: user.email || '',
        name: name,
        role: role,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
      };
      
      const phoneToSave = phoneNumber || user.phoneNumber;
      if (phoneToSave) {
        newProfile.phoneNumber = phoneToSave;
      }
      
      console.log("Saving profile to Firestore...");
      await setDoc(userDocRef, newProfile);
      console.log("Profile saved successfully");
      
      setProfile(newProfile);
    } catch (error) {
      console.error("Error in completeRegistration:", error);
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Remove undefined values
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if ((updates as any)[key] !== undefined) {
          cleanUpdates[key] = (updates as any)[key];
        }
      });
      
      // Use updateDoc to only send the changed fields, which is safer with strict security rules
      if (Object.keys(cleanUpdates).length > 0) {
        await updateDoc(userDocRef, cleanUpdates);
        setProfile({ ...profile, ...cleanUpdates });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, signIn, signInWithEmail, signUpWithEmail, signInWithPhone, setupRecaptcha, recaptchaSolved, verifyOtp, linkPhone, verifyAndLinkPhone, logOut, completeRegistration, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
