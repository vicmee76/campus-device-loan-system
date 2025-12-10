export const createUserRule = {
  email: 'required|email|max:255',
  password: 'required|string|min:8|max:255|strong_password',
  firstName: 'required|string|min:2|max:100',
  lastName: 'required|string|min:2|max:100',
  role: 'required|string|in:student,staff',
};

export const updateUserRule = {
  email: 'email|max:255',
  firstName: 'string|min:2|max:100',
  lastName: 'string|min:2|max:100',
  role: 'string|in:student,staff',
  isActive: 'boolean',
};

export const emailRule = {
  email: 'required|email|max:255',
};

export const loginRule = {
  email: 'required|email|max:255',
  password: 'required|string',
};

