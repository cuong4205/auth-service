/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterRequestDto } from './dto/register_request.dto';
import { AccessToken } from './types/access_token';
import { Public } from './decorator/public.decorator';
import { GrpcMethod } from '@nestjs/microservices';
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

  // test jwt protection
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'This is a protected route',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user: req.user,
    };
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: { token: string }) {
    return this.authService.validateToken(data);
  }

  @Get('user')
  async getUser(@Query('email') email: string): Promise<any> {
    return await this.authService.findUser({ email });
  }

  @Post('create')
  async createUser(@Body() user: RegisterRequestDto): Promise<any> {
    return await this.authService.createUser(user);
  }
}
