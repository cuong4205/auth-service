import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccessToken } from './types/access_token';
import { RegisterRequestDto } from './model/register_request.dto';
import { Observable } from 'rxjs';
import { LoginDto } from './model/login.dto';

interface UserService {
  findUserByEmail(email: string): Observable<any>;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private usersService: UserService,
    private jwtService: JwtService,
  ) {}
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  async login(user: LoginDto): Promise<AccessToken> {
    return { access_token: this.jwtService.sign(user) };
  }

  async register(user: RegisterRequestDto): Promise<AccessToken> {
    const existingUser = await this.usersService.findUserByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = { ...user, password: hashedPassword };
    await this.usersService.create(newUser);
    return this.login(newUser);
  }
}
