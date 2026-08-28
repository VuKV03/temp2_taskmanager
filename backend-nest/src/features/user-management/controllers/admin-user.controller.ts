import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../../shared/decorators/roles.decorator.js';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../shared/decorators/current-user.decorator.js';
import { AdminUserService } from '../services/admin-user.service.js';
import { QueryUserDto } from '../dto/query-user.dto.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UpdateRoleDto } from '../dto/update-role.dto.js';
import { UpdateStatusDto } from '../dto/update-status.dto.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';

@ApiTags('admin-users')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with filters' })
  findMany(@Query() query: QueryUserDto) {
    return this.adminUserService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user detail + their task statistics' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUserService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user manually' })
  create(@Body() dto: CreateUserDto) {
    return this.adminUserService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user info' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.adminUserService.update(id, dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminUserService.updateRole(admin, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate/deactivate user' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminUserService.updateStatus(admin, id, dto);
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Force password reset' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.adminUserService.resetPassword(admin, id, dto);
    return { message: 'Password reset' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete user (is_active = false)' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: JwtPayload) {
    await this.adminUserService.remove(admin, id);
    return { message: 'User deactivated' };
  }
}
