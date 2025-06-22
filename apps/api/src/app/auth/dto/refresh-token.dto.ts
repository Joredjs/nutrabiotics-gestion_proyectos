import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de actualización'
  })
  @IsString({ message: 'El token de actualización debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token de actualización es requerido' })
  refreshToken: string;
}
