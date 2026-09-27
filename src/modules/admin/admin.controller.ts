import {
    Controller,
    Get,
    Param,
    Patch,
    Body,
    UseGuards,
} from '@nestjs/common';


import {
    ApiBearerAuth,
    ApiTags,
} from '@nestjs/swagger';


import {
    AuthGuard,
} from '@nestjs/passport';


import {
    AdminGuard,
} from './admin.guard.js';


import {
    AdminOnly,
} from './admin.decorator.js';


import {
    AdminService,
} from './admin.service.js';


import {
    UpdateUserRoleDto,
} from './dto/update-user-role.dto.js';


import {
    UpdateUserStatusDto,
} from './dto/update-user-status.dto.js';



@ApiTags('Admin')
@ApiBearerAuth('access-token')

@Controller('admin')

@UseGuards(
    AuthGuard('jwt'),
    AdminGuard,
)

export class AdminController {


    constructor(
        private readonly service:
            AdminService,
    ) { }



    @Get('dashboard')
    @AdminOnly()
    dashboard() {

        return this.service
            .dashboard();

    }



    @Get('users')
    users() {

        return this.service
            .users();

    }



    @Patch('users/:id/role')
    updateRole(

        @Param('id')
        id: string,

        @Body()
        dto:
            UpdateUserRoleDto,

    ) {

        return this.service
            .updateRole(
                id,
                dto.role,
            );

    }



    @Patch('users/:id/status')
    updateStatus(

        @Param('id')
        id: string,

        @Body()
        dto:
            UpdateUserStatusDto,

    ) {

        return this.service
            .updateStatus(
                id,
                dto.isActive,
            );

    }



    @Get('analytics/usage')
    usage() {

        return this.service
            .usageAnalytics();

    }



    @Get('audit-logs')
    audit() {

        return this.service
            .auditLogs();

    }


}