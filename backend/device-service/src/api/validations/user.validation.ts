export const createUserRule = {
  Email: 'required|email|max:255',
  Password: 'required|string|min:8|max:255|strong_password',
  FirstName: 'required|string|min:2|max:100',
  LastName: 'required|string|min:2|max:100',
  Role: 'required|string|in:student,staff',
};

export const updateUserRule = {
  Email: 'email|max:255',
  FirstName: 'string|min:2|max:100',
  LastName: 'string|min:2|max:100',
  Role: 'string|in:student,staff',
  IsActive: 'boolean',
};

export const updatePasswordRule = {
  Password: 'required|string|min:8|max:255|strong_password',
};

export const emailRule = {
  email: 'required|email|max:255',
};

