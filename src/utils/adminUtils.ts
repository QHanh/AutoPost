// Utility function để tạo user admin tạm thời cho testing
export const createTempAdminUser = () => {
  const adminUser = {
    id: 'admin_001',
    email: 'admin@example.com',
    full_name: 'Administrator',
    token: 'temp_admin_token',
    role: 'admin' as const
  };

  localStorage.setItem('auth_token', adminUser.token);
  localStorage.setItem('user_data', JSON.stringify({
    id: adminUser.id,
    email: adminUser.email,
    full_name: adminUser.full_name,
    role: adminUser.role
  }));

  return adminUser;
};

// Function để kiểm tra xem có phải admin user không
export const isAdminUser = (user: any) => {
  return user && user.role === 'admin';
};

// Function để tạo user với role khác nhau cho testing
export const createTempUser = (role: 'admin' | 'user' = 'user') => {
  const user = {
    id: `${role}_001`,
    email: `${role}@example.com`,
    full_name: role.charAt(0).toUpperCase() + role.slice(1),
    token: `temp_${role}_token`,
    role
  };

  localStorage.setItem('auth_token', user.token);
  localStorage.setItem('user_data', JSON.stringify({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role
  }));

  return user;
}; 