import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../components/AuthGuard';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }
    fetchUser();
  }, [authUser]);

  async function fetchUser() {
    let { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (error || !data) {
      const { data: emailMatch, error: emailErr } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (!emailErr && emailMatch) {
        await supabase
          .from('admin_users')
          .update({ auth_id: authUser.id })
          .eq('id', emailMatch.id);
        data = emailMatch;
      }
    }

    if (!data) {
      console.error('No admin_users record found for this account');
      setLoading(false);
      return;
    }

    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
      role: data.role,
      moduleAccess: data.module_access || [],
      avatarUrl: data.avatar_url,
    });
    setLoading(false);
  }

  async function updateUser(fields) {
    const snakeFields = {};
    if (fields.name !== undefined) snakeFields.name = fields.name;
    if (fields.email !== undefined) snakeFields.email = fields.email;
    if (fields.phone !== undefined) snakeFields.phone = fields.phone;
    if (fields.jobTitle !== undefined) snakeFields.job_title = fields.jobTitle;

    const { data, error } = await supabase
      .from('admin_users')
      .update(snakeFields)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error.message);
      return false;
    }

    setUser((prev) => ({
      ...prev,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
    }));
    return true;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ user, loading, updateUser, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
