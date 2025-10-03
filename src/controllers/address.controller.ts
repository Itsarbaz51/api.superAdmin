import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import AddressValidationSchemas from "../validations/addressValidation.schemas.js";
import AddressServices from "../services/address.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class AddressController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {});
  static update = asyncHandler(async (req: Request, res: Response) => {});
  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

class StateController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = await AddressValidationSchemas.State.parseAsync(
      req.body
    );

    const dbStoreData = await AddressServices.storeState(validatedData);

    res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "State created successfully", 201)
      );
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = await AddressValidationSchemas.State.parseAsync(
      req.body
    );

    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Invalid request", ["State ID is required"]);
    }

    const dbUpdateData = await AddressServices.updateState(validatedData, id);

    res
      .status(200)
      .json(
        ApiResponse.success(dbUpdateData, "State updated successfully", 200)
      );
  });

  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

class CityController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = await AddressValidationSchemas.City.parseAsync(
      req.body
    );

    const dbStoreData = await AddressServices.storeCity(validatedData);

    res
      .status(201)
      .json(ApiResponse.success(dbStoreData, "City created successfully", 201));
  });
  static update = asyncHandler(async (req: Request, res: Response) => {});
  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

export { AddressController, StateController, CityController };
