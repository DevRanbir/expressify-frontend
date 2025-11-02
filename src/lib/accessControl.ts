import { User as FirebaseUser } from "firebase/auth";
import { ref, get } from "firebase/database";
import { database } from "./firebase";

// Features restricted to paid plans
export const RESTRICTED_FEATURES = {
  'ai-calling': ['student', 'premium'],
  'vc-person': ['student', 'premium'],
  'learning-path': ['student', 'premium'],
  'visual-practice': ['student', 'premium'],
};

// Check if user has access to a feature
export async function hasFeatureAccess(
  user: FirebaseUser | null,
  feature: keyof typeof RESTRICTED_FEATURES
): Promise<boolean> {
  if (!user) return false;

  try {
    const userRef = ref(database, `users/${user.uid}/subscription`);
    const snapshot = await get(userRef);

    const plan = snapshot.exists() ? snapshot.val().plan : 'freemium';
    const allowedPlans = RESTRICTED_FEATURES[feature];

    return allowedPlans.includes(plan);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

// Get user's current plan
export async function getUserPlan(user: FirebaseUser | null): Promise<string> {
  if (!user) return 'freemium';

  try {
    const userRef = ref(database, `users/${user.uid}/subscription`);
    const snapshot = await get(userRef);

    return snapshot.exists() ? snapshot.val().plan : 'freemium';
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return 'freemium';
  }
}

// Check if navigation item should be visible based on plan
export function isFeatureAccessible(itemId: string, userPlan: string): boolean {
  if (!(itemId in RESTRICTED_FEATURES)) {
    return true; // Not a restricted feature
  }

  const allowedPlans = RESTRICTED_FEATURES[itemId as keyof typeof RESTRICTED_FEATURES];
  return allowedPlans.includes(userPlan);
}
