const {
  extractBearerToken,
  getSupabaseClient,
  getAnonClient,
} = require('./supabaseClient.cjs');

function authorizeRoles(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const token = extractBearerToken(req);

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Use anon client to verify the JWT token (service role key does NOT work for getUser)
      const anonClient = getAnonClient();
      const {
        data: { user },
        error: authError,
      } = await anonClient.auth.getUser(token);

      if (authError || !user) {
        console.error('[authorizeRoles] token verification failed:', authError?.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Use service role client to bypass RLS for profile lookup
      const adminClient = getSupabaseClient();
      const { data: profile, error: profileError } = await adminClient
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('[authorizeRoles] profile lookup failed:', profileError?.message);
        return res.status(403).json({
          error: 'Access Denied: User profile not found.',
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role.toLowerCase())) {
        return res.status(403).json({
          error: 'Access Denied: Insufficient application clearances.',
        });
      }

      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role?.toLowerCase(),
      };

      return next();
    } catch (err) {
      console.error('[authorizeRoles]', err);
      return res.status(500).json({ error: 'Authentication service unavailable.' });
    }
  };
}

module.exports = { authorizeRoles };
