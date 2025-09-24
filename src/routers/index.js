import roleRoutes from "./role.route.js";
import userRoutes from "./user.route.js";

export default function registerRoutes(app) {
  app.use("/api/roles", roleRoutes);
  app.use("/api/users", userRoutes);
}
