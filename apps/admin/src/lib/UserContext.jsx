import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const UserContext = createContext(null);

const CURRENT_USER_EMAIL = 'james@noltmathis.com';

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', CURRENT_USER_EMAIL)
        .single();

      if (error) {
        console.error('Failed to load user:', error.message);
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

    fetchUser();
  }, []);

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

  return (
    <UserContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
