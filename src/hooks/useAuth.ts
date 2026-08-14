// TODO: Implement auth hook
// - Expose: user, isAuthenticated, isLoading, signIn, signOut
// - Check keychain for stored tokens on mount
// - Handle token refresh logic

export function useAuth() {
  // TODO: Implement
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    signIn: async () => {},
    signOut: async () => {},
  };
}
