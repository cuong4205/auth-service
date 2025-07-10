/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccessToken } from './types/access_token';
import { RegisterRequestDto } from './dto/register_request.dto';
import { lastValueFrom, Observable } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { ClientGrpc } from '@nestjs/microservices';

interface UserResponse {
  id: string;
  user_name: string;
  email: string;
  age: number;
  password: string;
}

interface UserService {
  findUserByEmail(request: { email: string }): Observable<UserResponse>;
  createUser(request: RegisterRequestDto): Observable<UserResponse>;
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
    console.log('[userService] methods:', Object.keys(this.userService));
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    console.log(loginDto);
    const user = await lastValueFrom(
      this.userService.findUserByEmail({ email: loginDto.email }),
    );
    if (!user) {
      console.log('gRPC server down');
      throw new BadRequestException('User not found');
    }
    console.log(user);
    const isMatch: boolean = bcrypt.compareSync(
      loginDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  validateToken(data: { token: string }) {
    try {
      const payload: UserResponse = this.jwtService.verify(data.token);
      return {
        valid: true,
        userId: payload.id,
        email: payload.email,
      };
    } catch (err) {
      console.log(err);
      return {
        valid: false,
        userId: '',
        email: '',
      };
    }
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

  async findUser(request: { email: string }): Promise<UserResponse> {
    const user = await lastValueFrom(this.userService.findUserByEmail(request));
    return user;
  }

  async createUser(request: RegisterRequestDto): Promise<UserResponse> {
    return await lastValueFrom(this.userService.createUser(request));
  }
}
