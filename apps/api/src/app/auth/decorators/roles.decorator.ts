import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@nutrabiotics-system/shared-types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
