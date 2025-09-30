import AuthRoutes from "./auth.routes.js";

export function StaticRoutes(app: any) {
  app.use("api/v1", AuthRoutes);
}
