export interface JwtPayload {
  sub: string; // user id
  email: string | null;
  username: string | null;
  rol: string;
  debeCambiarPassword: boolean;
}
