/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterRequestDto } from './dto/register_request.dto';
import { AccessToken } from './types/access_token';
import { Public } from './decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req): Promise<AccessToken | BadRequestException> {
    return this.authService.login(req.user);
  }
  @Post('register')
  async register(
    @Body() registerBody: RegisterRequestDto,
  ): Promise<AccessToken | BadRequestException> {
    return await this.authService.register(registerBody);
  }
}
