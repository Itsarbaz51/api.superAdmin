import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";

class RoleController {
  static index = asyncHandler(async (req: Request, res: Response) => {});

  static show = asyncHandler(async (req: Request, res: Response) => {});

  static store = asyncHandler(async (req: Request, res: Response) => {
    // 1. Get role input from req.body (name, level, description)
    // 2. Check all required fields are present
    // 3. Validate all input fields (e.g. name is string, level is number, etc.)
    // 4. Check if a role with the same name OR level already exists
    // 5. If exists, return error response
    // 6. Optional: Check if the user creating the role has permission to do so (RBAC)
    // 7. Optional: Validate role level (e.g. super admin > admin > user, level must be unique and properly ordered)
    // 8. Create the role record in the database
    // 9. Optional: Assign default permissions to this role (create RolePermission entries)
    // 10. Return success response with created role data
  });

  static update = asyncHandler(async (req: Request, res: Response) => {});

  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

export default RoleController;
