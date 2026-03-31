export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface Propietario {
  id: number;
  nombre: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  cuentas: Propietario[];
}

export interface SelectAccountResponse {
  token: string;
  propietario: Propietario;
}
