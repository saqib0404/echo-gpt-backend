import { RoleName } from "../../generated/prisma/enums.js";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: RoleName[];
  sessionId: string;
}