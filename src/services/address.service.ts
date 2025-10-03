import Prisma from "../db/db.js";
import type { City, State } from "../types/address.types.js";
import { ApiError } from "../utils/ApiError.js";

class AddressServices {
  // user addresses
  static async storeUserAddress(): Promise<void> {}
  static async updateUserAddress(): Promise<void> {}
  static async deleteUserAddress(): Promise<void> {}
  static async getUserAddress(): Promise<void> {}

  // states
  static async storeState(payload: State): Promise<State> {
    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: payload.stateName },
    });
    if (alreadyExists) {
      throw ApiError.badRequest("State already exists", [
        "A state with the same name already exists.",
      ]);
    }
    const createdState = await Prisma.state.create({
      data: {
        stateName:
          payload.stateName.charAt(0).toUpperCase() +
          payload.stateName.slice(1),
      },
    });

    if (!createdState) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to create state record.",
      ]);
    }

    return createdState;
  }
  static async updateState(payload: State, id: string): Promise<State> {
    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: payload.stateName },
    });
    if (alreadyExists) {
      throw ApiError.badRequest("State already exists", [
        "A state with the same name already exists.",
      ]);
    }
    // const { id } = req.params;

    const updatedState = await Prisma.state.update({
      where: { id },
      data: {
        stateName:
          payload.stateName.charAt(0).toUpperCase() +
          payload.stateName.slice(1),
      },
    });
    if (!updatedState) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to update state record.",
      ]);
    }
    return updatedState;
  }
  static async deleteState(): Promise<void> {}
  static async getState(): Promise<void> {}
  static async listStates(): Promise<void> {}

  // cities
  static async storeCity(payload: City): Promise<City> {
    const createdCity = await Prisma.city.create({
      data: {
        cityName:
          payload.cityName.charAt(0).toUpperCase() + payload.cityName.slice(1),
      },
    });
    if (!createdCity) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to create city record.",
      ]);
    }
    return createdCity;
  }
  static async updateCity(): Promise<void> {}
  static async deleteCity(): Promise<void> {}
  static async getCity(): Promise<void> {}
  static async listCities(): Promise<void> {}
}

export default AddressServices;
