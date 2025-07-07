/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccessToken } from './types/access_token';
import { RegisterRequestDto } from './dto/register_request.dto';
import { lastValueFrom, Observable } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { ClientGrpc } from '@nestjs/microservices';

interface UserService {
  findUserByEmail(request: { email: string }): Observable<any>;
  createUser(request: RegisterRequestDto): Observable<any>;
}

@Injectable()
export class AuthService {
  private userService: UserService;
  constructor(
    @Inject('USER_PACKAGE') private client: ClientGrpc,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService');
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await lastValueFrom(
      this.userService.findUserByEmail({ email: loginDto.email }),
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = bcrypt.compareSync(
      loginDto.password,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user.password as string,
    );
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async login(user: RegisterRequestDto): Promise<AccessToken> {
    const payload = { email: user.email, id: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(user: RegisterRequestDto): Promise<AccessToken> {
    const existingUser = await lastValueFrom(
      this.userService.findUserByEmail({ email: user.email }),
    );
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = { ...user, password: hashedPassword };
    await lastValueFrom(this.userService.createUser(newUser));
    return this.login(newUser);
  }
}
