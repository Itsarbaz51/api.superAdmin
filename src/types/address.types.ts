export interface Address {
  id: string;
  address: string;
  pinCode: string;
  stateId: string;
  cityId: string;
}

export interface City {
  id: string;
  cityName: string;
}

export interface State {
  stateName: string;
}
