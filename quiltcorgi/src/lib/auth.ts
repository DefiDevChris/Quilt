// Auth module — delegates to Cognito.
// Kept as a single import point for backward compatibility.
export { getSession as auth } from '@/lib/cognito-session';
export {
  cognitoSignIn as signIn,
  cognitoSignUp as signUp,
  cognitoGlobalSignOut as signOut,
} from '@/lib/cognito';
