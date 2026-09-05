import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, updateDoc, orderBy, limit } from 'firebase/firestore';
import { firestore } from './firebase';
import { safeStorage } from './storage';
import { User, UserPresence, LiveUserActivity } from '../types';
import { api } from './api';
import bcrypt from 'bcryptjs';

export const LEGACY_DUMMY_EMAILS = new Set([
  'user@hishabkhata.com',
  'admin@hishabkhata.com',
  'admin@hishabkhata.io',
  'demo@hishabkhata.io',
]);

export interface PersistentAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  preferredLanguage: string;
  preferredCurrency: string;
  plan: 'free' | 'pro';
  role: 'user' | 'admin';
  status: 'active' | 'deactivated';
  lookupKeys: string[];
  createdAt: string;
  updatedAt: string;
}

const VAULT_KEY = 'hk_account_vault';

export function normalizeBDPhone(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+880')) {
    return '0' + digitsOnly.slice(4);
  }
  if (digitsOnly.startsWith('880')) {
    return '0' + digitsOnly.slice(3);
  }
  if (digitsOnly.length === 10 && digitsOnly.startsWith('1')) {
    return '0' + digitsOnly;
  }
  return digitsOnly;
}

export function isPhoneNumber(val: string): boolean {
  const clean = val.replace(/[\s\-\(\)]/g, '');
  return !clean.includes('@') && /^\+?[0-9]{7,15}$/.test(clean);
}

export function sanitizeDocId(val: string): string {
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 100);
}

export function generateLookupKeys(identifier: string, name?: string, phone?: string): string[] {
  const keys = new Set<string>();
  const clean = identifier.trim().toLowerCase();
  if (clean) keys.add(clean);

  const isPhone = isPhoneNumber(identifier);
  const digits = identifier.replace(/\D/g, '');

  if (isPhone || digits.length >= 7) {
    keys.add(digits);
    const norm = normalizeBDPhone(digits);
    if (norm) {
      keys.add(norm);
      keys.add(`${norm}@mobile.hishabkhata.com`);
    }
  }

  if (phone) {
    const pClean = phone.trim().toLowerCase();
    keys.add(pClean);
    const pDigits = phone.replace(/\D/g, '');
    if (pDigits) {
      keys.add(pDigits);
      const pNorm = normalizeBDPhone(pDigits);
      if (pNorm) {
        keys.add(pNorm);
        keys.add(`${pNorm}@mobile.hishabkhata.com`);
      }
    }
  }

  if (name) {
    keys.add(name.trim().toLowerCase());
  }

  return Array.from(keys).filter(Boolean);
}

export function getLocalVault(): Record<string, PersistentAccount> {
  try {
    const raw = safeStorage.getItem(VAULT_KEY);
    if (!raw) return {};
    const parsed: Record<string, PersistentAccount> = JSON.parse(raw);
    let modified = false;
    for (const key of Object.keys(parsed)) {
      if (
        LEGACY_DUMMY_EMAILS.has(key.toLowerCase()) ||
        LEGACY_DUMMY_EMAILS.has((parsed[key]?.email || '').toLowerCase().trim())
      ) {
        delete parsed[key];
        modified = true;
      }
    }
    if (modified) {
      safeStorage.setItem(VAULT_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {};
  }
}

export function saveLocalVault(vault: Record<string, PersistentAccount>): void {
  try {
    safeStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Could not update local vault:', err);
  }
}

export function saveToLocalVault(account: PersistentAccount): void {
  try {
    const vault = getLocalVault();
    for (const key of account.lookupKeys) {
      vault[key] = account;
    }
    vault[account.id] = account;
    safeStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Could not save to local vault:', err);
  }
}

export async function saveAccountToCloud(
  user: User,
  rawPassword?: string,
  existingHash?: string
): Promise<void> {
  try {
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const cleanPhone = user.phone ? normalizeBDPhone(user.phone) : undefined;
    const lookupKeys = generateLookupKeys(cleanEmail, user.name, cleanPhone);

    const hash = existingHash || (rawPassword ? bcrypt.hashSync(rawPassword, 10) : '');

    const account: PersistentAccount = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      passwordHash: hash,
      preferredLanguage: user.preferredLanguage || 'en',
      preferredCurrency: user.preferredCurrency || 'BDT',
      plan: user.plan || 'free',
      role: user.role || 'user',
      status: user.status || 'active',
      lookupKeys,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local device vault
    saveToLocalVault(account);

    // 2. Save directly to Cloud Firestore `users` collection as primary source of truth
    const userDocRef = doc(firestore, 'users', user.id);
    const userProfileData: Partial<User> & { lookupKeys: string[]; updatedAt: string } = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'user',
      plan: user.plan || 'free',
      status: user.status || 'active',
      preferredLanguage: user.preferredLanguage || 'en',
      preferredCurrency: user.preferredCurrency || 'BDT',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lookupKeys,
    };
    await setDoc(userDocRef, userProfileData, { merge: true });

    // 3. Save to Cloud Firestore `app_accounts` for credential verification
    const primaryKey = cleanEmail || cleanPhone || user.id;
    const docId = `acc_${sanitizeDocId(primaryKey)}`;
    const docRef = doc(firestore, 'app_accounts', docId);
    await setDoc(docRef, account, { merge: true });

    // Also index by phone docId if different from primary
    if (cleanPhone && cleanPhone !== cleanEmail) {
      const phoneDocId = `acc_${sanitizeDocId(cleanPhone)}`;
      const phoneRef = doc(firestore, 'app_accounts', phoneDocId);
      await setDoc(phoneRef, account, { merge: true });
    }
  } catch (err) {
    console.warn('Could not sync account to cloud Firestore:', err);
  }
}

export async function findPersistentAccount(
  rawIdentifier: string
): Promise<PersistentAccount | null> {
  const clean = rawIdentifier.trim().toLowerCase();
  if (LEGACY_DUMMY_EMAILS.has(clean)) {
    return null;
  }
  const digits = clean.replace(/\D/g, '');
  const normPhone = digits.length >= 7 ? normalizeBDPhone(digits) : '';

  // 1. Check local vault first
  const vault = getLocalVault();
  if (vault[clean]) return vault[clean];
  if (normPhone && vault[normPhone]) return vault[normPhone];
  if (digits && vault[digits]) return vault[digits];

  // 2. Check Firestore direct doc lookup
  try {
    const docId = `acc_${sanitizeDocId(clean)}`;
    const docSnap = await getDoc(doc(firestore, 'app_accounts', docId));
    if (docSnap.exists()) {
      const data = docSnap.data() as PersistentAccount;
      saveToLocalVault(data);
      return data;
    }

    if (normPhone) {
      const phoneDocId = `acc_${sanitizeDocId(normPhone)}`;
      const phoneSnap = await getDoc(doc(firestore, 'app_accounts', phoneDocId));
      if (phoneSnap.exists()) {
        const data = phoneSnap.data() as PersistentAccount;
        saveToLocalVault(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('Firestore doc lookup error:', e);
  }

  // 3. Check Firestore array query
  try {
    const q = query(
      collection(firestore, 'app_accounts'),
      where('lookupKeys', 'array-contains', clean)
    );
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const data = qSnap.docs[0].data() as PersistentAccount;
      saveToLocalVault(data);
      return data;
    }

    if (normPhone) {
      const qPhone = query(
        collection(firestore, 'app_accounts'),
        where('lookupKeys', 'array-contains', normPhone)
      );
      const qPhoneSnap = await getDocs(qPhone);
      if (!qPhoneSnap.empty) {
        const data = qPhoneSnap.docs[0].data() as PersistentAccount;
        saveToLocalVault(data);
        return data;
      }
    }
  } catch (e) {
    console.warn('Firestore query lookup error:', e);
  }

  return null;
}

export const DEFAULT_SYSTEM_USERS: User[] = [
  {
    id: 'admin-sultan-001',
    name: 'Sultan (Owner Admin)',
    email: 'sultanitbangladesh@gmail.com',
    phone: '01700000001',
    role: 'admin',
    preferredLanguage: 'en',
    preferredCurrency: 'BDT',
    plan: 'pro',
    status: 'active',
    emailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export async function seedDefaultUsersToFirestore(): Promise<void> {
  try {
    for (const u of DEFAULT_SYSTEM_USERS) {
      const pass = 'admin123';
      await saveAccountToCloud(u, pass);
    }
  } catch (err) {
    console.warn('Error seeding system users to Firestore:', err);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  const usersById = new Map<string, User>();
  const emailToId = new Map<string, string>();
  const phoneToId = new Map<string, string>();

  const registerOrMergeUser = (rawUser: Partial<User> & { id?: string }) => {
    if (!rawUser) return;
    const cleanEmail = (rawUser.email || '').toLowerCase().trim();
    const cleanPhone = (rawUser.phone || '').replace(/\D/g, '');
    const givenId = rawUser.id?.trim();

    // Skip any legacy demo user accounts
    if (cleanEmail && LEGACY_DUMMY_EMAILS.has(cleanEmail)) {
      return;
    }

    // Determine canonical ID
    let canonicalId = givenId;
    if (!canonicalId) {
      if (cleanEmail && emailToId.has(cleanEmail)) {
        canonicalId = emailToId.get(cleanEmail)!;
      } else if (cleanPhone && phoneToId.has(cleanPhone)) {
        canonicalId = phoneToId.get(cleanPhone)!;
      } else {
        canonicalId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }
    } else {
      // If we already know an ID associated with this email or phone, unify with it
      if (cleanEmail && emailToId.has(cleanEmail)) {
        canonicalId = emailToId.get(cleanEmail)!;
      } else if (cleanPhone && phoneToId.has(cleanPhone)) {
        canonicalId = phoneToId.get(cleanPhone)!;
      }
    }

    const existing = usersById.get(canonicalId);
    const merged: User = {
      id: canonicalId,
      name: rawUser.name || existing?.name || 'Unnamed User',
      email: rawUser.email || existing?.email || '',
      phone: rawUser.phone || existing?.phone || '',
      role: rawUser.role || existing?.role || 'user',
      plan: rawUser.plan || existing?.plan || 'free',
      status: rawUser.status || existing?.status || 'active',
      emailVerified: true,
      preferredLanguage: rawUser.preferredLanguage || existing?.preferredLanguage || 'en',
      preferredCurrency: rawUser.preferredCurrency || existing?.preferredCurrency || 'BDT',
      createdAt: rawUser.createdAt || existing?.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || existing?.updatedAt || new Date().toISOString(),
    };

    usersById.set(canonicalId, merged);
    if (cleanEmail) emailToId.set(cleanEmail, canonicalId);
    if (cleanPhone) phoneToId.set(cleanPhone, canonicalId);
  };

  // 1. Add default system users (only Owner Admin) as baseline
  for (const u of DEFAULT_SYSTEM_USERS) {
    registerOrMergeUser(u);
  }

  // 2. Query Firestore `users` collection directly
  try {
    const usersSnap = await getDocs(collection(firestore, 'users'));
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data() as Partial<User>;
      const userEmail = (data.email || '').toLowerCase().trim();
      if (userEmail && LEGACY_DUMMY_EMAILS.has(userEmail)) {
        // Asynchronously delete legacy demo account from Firestore
        deleteDoc(doc(firestore, 'users', docSnap.id)).catch(() => {});
        continue;
      }
      if (data && (data.email || data.name || data.phone || docSnap.id)) {
        registerOrMergeUser({
          ...data,
          id: data.id || docSnap.id,
        });
      }
    }
  } catch (err) {
    console.warn('Could not read users collection from Firestore:', err);
  }

  // 3. Query Firestore `app_accounts` collection directly
  try {
    const accSnap = await getDocs(collection(firestore, 'app_accounts'));
    for (const docSnap of accSnap.docs) {
      const data = docSnap.data() as Partial<PersistentAccount>;
      const userEmail = (data.email || '').toLowerCase().trim();
      if (userEmail && LEGACY_DUMMY_EMAILS.has(userEmail)) {
        // Asynchronously delete legacy demo account from Firestore
        deleteDoc(doc(firestore, 'app_accounts', docSnap.id)).catch(() => {});
        continue;
      }
      if (data && (data.email || data.name || data.phone || docSnap.id)) {
        registerOrMergeUser({
          id: data.id || docSnap.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          plan: data.plan,
          status: data.status,
          preferredLanguage: data.preferredLanguage,
          preferredCurrency: data.preferredCurrency,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    }
  } catch (err) {
    console.warn('Could not read app_accounts collection from Firestore:', err);
  }

  // 4. Query backend database if admin token is present and sync any newly registered to Firestore
  try {
    const backendUsers = await api.getAdminUsers();
    if (Array.isArray(backendUsers)) {
      for (const bUser of backendUsers) {
        if (bUser && bUser.id) {
          registerOrMergeUser(bUser);
          saveAccountToCloud(bUser).catch(() => {});
        }
      }
    }
  } catch {
    // Non-blocking if admin not logged in or backend unavailable
  }

  return Array.from(usersById.values());
}

export function subscribeToFirestoreUsers(
  onUpdate: (users: User[]) => void
): () => void {
  // Trigger initial seed and fetch
  seedDefaultUsersToFirestore().catch(() => {});
  fetchAllUsersFromFirestore().then(onUpdate).catch(() => {});

  try {
    const unsub = onSnapshot(collection(firestore, 'users'), async () => {
      const freshUsers = await fetchAllUsersFromFirestore();
      onUpdate(freshUsers);
    }, (err) => {
      console.warn('Firestore users subscription listener error:', err);
    });
    return unsub;
  } catch (err) {
    console.warn('Could not setup onSnapshot for Firestore users:', err);
    return () => {};
  }
}

export async function deleteUserFromFirestore(
  userId: string,
  email?: string,
  phone?: string
): Promise<boolean> {
  try {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (cleanEmail === 'sultanitbangladesh@gmail.com' || userId === 'admin-sultan-001') {
      throw new Error('Cannot delete Primary Owner Admin');
    }

    // 1. Delete from Firestore users collection
    try {
      await deleteDoc(doc(firestore, 'users', userId));
    } catch {}

    // 2. Delete from Firestore app_accounts collection
    const keysToDelete: string[] = [];
    if (cleanEmail) keysToDelete.push(cleanEmail);
    if (phone) keysToDelete.push(phone.replace(/\D/g, ''));
    keysToDelete.push(userId);

    for (const k of keysToDelete) {
      if (k) {
        try {
          await deleteDoc(doc(firestore, 'app_accounts', `acc_${sanitizeDocId(k)}`));
        } catch {}
      }
    }

    // 3. Remove from local vault
    const vault = getLocalVault();
    for (const k of keysToDelete) {
      delete vault[k];
    }
    saveLocalVault(vault);

    // 4. Also call server delete endpoint
    try {
      await api.deleteAdminUser(userId);
    } catch {}

    return true;
  } catch (err) {
    console.warn('Error deleting user from Firestore:', err);
    return false;
  }
}

export async function purgeAllNonAdminUsersFromFirestore(): Promise<{ deletedCount: number }> {
  let deletedCount = 0;
  const ownerEmail = 'sultanitbangladesh@gmail.com';

  try {
    // 1. Delete all non-admin users from Firestore `users` collection
    const usersSnap = await getDocs(collection(firestore, 'users'));
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data() as Partial<User>;
      const userEmail = (data.email || '').toLowerCase().trim();
      if (userEmail !== ownerEmail && docSnap.id !== 'admin-sultan-001') {
        await deleteDoc(doc(firestore, 'users', docSnap.id));
        deletedCount++;
      }
    }

    // 2. Delete all non-admin accounts from Firestore `app_accounts` collection
    const accSnap = await getDocs(collection(firestore, 'app_accounts'));
    for (const docSnap of accSnap.docs) {
      const data = docSnap.data() as Partial<PersistentAccount>;
      const userEmail = (data.email || '').toLowerCase().trim();
      if (userEmail !== ownerEmail && !docSnap.id.includes('sultanitbangladesh')) {
        await deleteDoc(doc(firestore, 'app_accounts', docSnap.id));
      }
    }

    // 3. Clean local vault
    const vault = getLocalVault();
    const cleanedVault: Record<string, PersistentAccount> = {};
    for (const [key, acc] of Object.entries(vault)) {
      if ((acc.email || '').toLowerCase().trim() === ownerEmail || key.includes('sultanitbangladesh')) {
        cleanedVault[key] = acc;
      }
    }
    saveLocalVault(cleanedVault);

    // 4. Purge backend DB
    try {
      await api.purgeNonAdminUsers();
    } catch {}

  } catch (err) {
    console.warn('Error purging non-admin users from Firestore:', err);
  }

  return { deletedCount };
}

export async function updateUserRoleOrPlanInFirestore(
  userId: string,
  updates: Partial<Pick<User, 'role' | 'plan' | 'status'>>
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error updating user in Firestore:', err);
  }
}

export async function recordUserPresenceInFirestore(presence: UserPresence): Promise<void> {
  try {
    if (!firestore || !presence.userId) return;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestore, 'user_presences', presence.userId);
    await setDoc(
      docRef,
      {
        userId: presence.userId,
        userName: presence.userName || 'User',
        userEmail: presence.userEmail || '',
        avatarUrl: presence.avatarUrl || '',
        plan: presence.plan || 'free',
        role: presence.role || 'user',
        isOnline: true,
        currentView: presence.currentView || 'dashboard',
        lastActiveAt: nowIso,
        updatedAt: nowIso,
        deviceType: presence.deviceType || 'desktop',
        browser: presence.browser || 'Web App',
        lastAction: presence.lastAction || `Active in ${presence.currentView || 'dashboard'}`,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to record presence in Firestore:', err);
  }
}

export async function fetchAllPresencesFromFirestore(): Promise<UserPresence[]> {
  try {
    if (!firestore) return [];
    const presencesRef = collection(firestore, 'user_presences');
    const snapshot = await getDocs(presencesRef);
    const list: UserPresence[] = [];
    const nowMs = Date.now();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.userId) {
        const lastActiveMs = new Date(data.lastActiveAt || data.updatedAt || 0).getTime();
        // Online if active within last 90 seconds
        const isOnline = (nowMs - lastActiveMs) < 90000;
        list.push({
          userId: data.userId,
          userName: data.userName || 'User',
          userEmail: data.userEmail || '',
          avatarUrl: data.avatarUrl || '',
          plan: data.plan || 'free',
          role: data.role || 'user',
          isOnline,
          currentView: data.currentView || 'dashboard',
          lastActiveAt: data.lastActiveAt || data.updatedAt || new Date().toISOString(),
          deviceType: data.deviceType || 'desktop',
          browser: data.browser || 'Web App',
          lastAction: data.lastAction || 'Active',
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('Failed to fetch presences from Firestore:', err);
    return [];
  }
}

export function subscribeToFirestorePresences(
  callback: (presences: UserPresence[]) => void
): () => void {
  try {
    if (!firestore) return () => {};
    const presencesRef = collection(firestore, 'user_presences');
    return onSnapshot(
      presencesRef,
      (snapshot) => {
        const list: UserPresence[] = [];
        const nowMs = Date.now();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.userId) {
            const lastActiveMs = new Date(data.lastActiveAt || data.updatedAt || 0).getTime();
            const isOnline = (nowMs - lastActiveMs) < 90000;
            list.push({
              userId: data.userId,
              userName: data.userName || 'User',
              userEmail: data.userEmail || '',
              avatarUrl: data.avatarUrl,
              plan: data.plan || 'free',
              role: data.role || 'user',
              isOnline,
              currentView: data.currentView || 'dashboard',
              lastActiveAt: data.lastActiveAt || data.updatedAt || new Date().toISOString(),
              deviceType: data.deviceType || 'desktop',
              browser: data.browser || 'Web App',
              lastAction: data.lastAction || 'Active',
            });
          }
        });
        // Sort: online users first, then by last active timestamp descending
        list.sort((a, b) => {
          if (a.isOnline === b.isOnline) {
            return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
          }
          return a.isOnline ? -1 : 1;
        });
        callback(list);
      },
      (err) => {
        console.warn('Firestore presence subscription warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}
