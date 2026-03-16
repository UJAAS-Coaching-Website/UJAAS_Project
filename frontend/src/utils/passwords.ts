export const generateInitialPassword = (name: string) => {
  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() || 'user';
  return `${firstName}@123`;
};
