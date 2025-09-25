import Prisma from "../db/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { checkUserAuth } from "../utils/lib.js";

// Create Service
export const createService = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { svgImage, name, description } = req.body;

  if (!name || !svgImage)
    return ApiError.send(res, 400, "Service name is required");

  const exists = await Prisma.service.findUnique({ where: { name } });
  if (exists) return ApiError.send(res, 409, "Service already exists");

  const service = await Prisma.service.create({
    data: { name, description, svgImage },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Service created successfully", service));
});

// Get All Services
export const getServices = asyncHandler(async (req, res) => {
  const services = await Prisma.service.findMany({
    include: { users: true },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Services fetched successfully", services));
});

// Update Service
export const updateService = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;
  const { name, description, svgImage } = req.body;

  if (!id) return ApiError.send(res, 400, "Service id is required");

  const updated = await Prisma.service.update({
    where: { id },
    data: { name, description, svgImage },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Service updated successfully", updated));
});

// Delete Service
export const deleteService = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;

  if (!id) return ApiError.send(res, 400, "Service id is required");

  await Prisma.userService.deleteMany({ where: { serviceId: id } }); // clean pivot
  await Prisma.service.delete({ where: { id } });

  return res
    .status(200)
    .json(new ApiResponse(200, "Service deleted successfully"));
});

// Assign Service to User
export const assignServiceToUser = asyncHandler(async (req, res) => {
  const { userId, serviceId } = req.body;

  if (!userId || !serviceId)
    return ApiError.send(res, 400, "UserId and ServiceId are required");

  // check both exist
  const user = await Prisma.user.findUnique({ where: { id: userId } });
  const service = await Prisma.service.findUnique({ where: { id: serviceId } });

  if (!user) return ApiError.send(res, 404, "User not found");
  if (!service) return ApiError.send(res, 404, "Service not found");

  // check already assigned
  const exists = await Prisma.userService.findUnique({
    where: { userId_serviceId: { userId, serviceId } },
  });

  if (exists) return ApiError.send(res, 409, "Service already assigned");

  const userService = await Prisma.userService.create({
    data: { userId, serviceId },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Service assigned successfully", userService));
});

// Unassign Service from User
export const unassignServiceFromUser = asyncHandler(async (req, res) => {
  const { userId, serviceId } = req.body;

  if (!userId || !serviceId)
    return ApiError.send(res, 400, "UserId and ServiceId are required");

  await Prisma.userService.delete({
    where: { userId_serviceId: { userId, serviceId } },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Service unassigned successfully"));
});

// Get User Services
export const getUserServices = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) return ApiError.send(res, 400, "UserId is required");

  const services = await Prisma.userService.findMany({
    where: { userId },
    include: { service: true },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User services fetched", services));
});
