import { z } from "zod";

class AuthValidationSchemas {
  static get register() {
    return z
      .object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
  }

  static get login() {
    return z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });
  }
}

export default AuthValidationSchemas;
