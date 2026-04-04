export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
}

export interface User {
  _id: string;
  phoneNumber: {
    countryCode: string;
    number: string | number;
  };
  name: string;
  role: 'Admin' | 'Delivery Person';
}

export interface IceCream {
  _id: string;
  name: string;
  price: number;
  discount: number;
  image: string;
  description: string;
}

export interface Address {
  city: string;
  state: string;
  zipCode: string;
  street: {
    streetNumber: string;
    streetName: string;
    houseNumber: string;
  };
}

export interface Customer {
  _id: string;
  phoneNumber: {
    countryCode: string;
    number: string | number;
  };
  savedAddress: Address;
}

export interface Order {
  _id: string;
  totalPrice: number;
  totalDiscount: number;
  orderStatus: string;
  deliveryStatus: string;
  deliveryDate: Date;
  customerId: string;
  deliveryPersonId: string;
  paymentId: string;
  deliveryAddress: Address;
}
