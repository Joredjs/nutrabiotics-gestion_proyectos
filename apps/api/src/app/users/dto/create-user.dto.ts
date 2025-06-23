import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@nutrabiotics-system/shared-types';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  name: string;

  @ApiProperty({ example: 'usuario@test.com' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DEVELOPER })
  @IsEnum(UserRole, { message: 'El rol debe ser uno de los valores válidos: ADMIN, MANAGER, DEVELOPER' })
  role: UserRole;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'El avatar debe ser una URL válida' })
  avatar?: string;
}
