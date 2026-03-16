import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return { data: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('users')
  async createUser(@Body() body: { username: string; password: string; displayName: string; email: string; role?: string }) {
    const user = await this.authService.createUser(body);
    return { data: user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  async getUsers() {
    const users = await this.authService.getUsers();
    return { data: users };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    const user = await this.authService.updateUser(id, body);
    return { data: user };
  }
}
