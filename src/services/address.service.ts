import Prisma from "../db/db.js";
import type {
  Address,
  AddressInput,
  City,
  CityInput,
  State,
  StateInput,
} from "../types/address.types.js";
import { ApiError } from "../utils/ApiError.js";

class AddressServices {
  // user addresses
  static async showAddress(id: string): Promise<Address> {
    const address = await Prisma.address.findUnique({
      where: { id },
    });
    if (!address) {
      throw ApiError.notFound("Not Found", ["Address not found"]);
    }
    return address;
  }
  static async storeUserAddress(payload: AddressInput): Promise<Address> {
    const createdAddress = await Prisma.address.create({
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
    });
    if (!createdAddress) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to create address record.",
      ]);
    }
    return createdAddress;
  }
  static async updateUserAddress(
    payload: AddressInput,
    id: string
  ): Promise<Address> {
    const updatedAddress = await Prisma.address.update({
      where: { id },
      data: {
        address: payload.address,
        pinCode: payload.pinCode,
        stateId: payload.stateId,
        cityId: payload.cityId,
      },
    });
    if (!updatedAddress) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to update address record.",
      ]);
    }
    return updatedAddress;
  }
  static async deleteUserAddress(id: string): Promise<Address> {
    const deletedAddress = await Prisma.address.delete({
      where: { id },
    });
    if (!deletedAddress) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to delete address record.",
      ]);
    }
    return deletedAddress;
  }

  // states
  static async indexState(): Promise<State[]> {
    const allStates = await Prisma.state.findMany();
    if (!allStates) {
      throw ApiError.notFound("Not Found", ["No states found"]);
    }

    return allStates;
  }
  static async storeState(payload: StateInput): Promise<State> {
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
  static async updateState(payload: StateInput, id: string): Promise<State> {
    const alreadyExists = await Prisma.state.findFirst({
      where: { stateName: payload.stateName },
    });
    if (alreadyExists) {
      throw ApiError.badRequest("Invalid request", [
        "A state with the same name already exists.",
      ]);
    }

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
  static async deleteState(id: string): Promise<State> {
    const deletedState = await Prisma.state.delete({
      where: { id },
    });
    if (!deletedState) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to delete state record.",
      ]);
    }
    return deletedState;
  }

  // cities
  static async indexCity(): Promise<City[]> {
    const allCities = await Prisma.city.findMany();
    if (!allCities) {
      throw ApiError.notFound("Not Found", ["No cities found"]);
    }
    return allCities;
  }
  static async storeCity(payload: CityInput): Promise<City> {
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
  static async updateCity(payload: CityInput, id: string): Promise<City> {
    const updatedCity = await Prisma.city.update({
      where: { id },
      data: {
        cityName:
          payload.cityName.charAt(0).toUpperCase() + payload.cityName.slice(1),
      },
    });
    if (!updatedCity) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to update city record.",
      ]);
    }
    return updatedCity;
  }
  static async deleteCity(id: string): Promise<City> {
    const deletedCity = await Prisma.city.delete({
      where: { id },
    });
    if (!deletedCity) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to delete city record.",
      ]);
    }
    return deletedCity;
  }
}

export default AddressServices;
