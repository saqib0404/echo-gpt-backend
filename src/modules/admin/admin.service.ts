import {
    Injectable,
} from '@nestjs/common';

import {
    PrismaService,
} from '../../database/prisma.service.js';


@Injectable()
export class AdminService {


    constructor(
        private readonly prisma:
            PrismaService,
    ) { }



    async dashboard() {

        const [
            users,
            conversations,
            searches,
            providers,
            usage
        ] = await Promise.all([

            this.prisma.user.count(),

            this.prisma.conversation.count(),

            this.prisma.webSearch.count(),

            this.prisma.aiProvider.count(),

            this.prisma.apiUsageLog.count(),

        ]);


        return {

            users,

            conversations,

            searches,

            providers,

            usageRequests:
                usage,

            generatedAt:
                new Date(),

        };

    }



    async users() {

        return this.prisma.user.findMany({

            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },

            orderBy: {
                createdAt: 'desc',
            },

        });

    }



    async updateRole(
        id: string,
        role: string,
    ) {

        return this.prisma.user.update({

            where: {
                id,
            },

            data: {
                role:
                    role as any,
            },

        });

    }



    async updateStatus(
        id: string,
        isActive: boolean,
    ) {

        return this.prisma.user.update({

            where: {
                id,
            },

            data: {
                isActive,
            },

        });

    }



    async usageAnalytics() {

        const usage =
            await this.prisma.apiUsageLog.groupBy({

                by: [
                    'type'
                ],

                _count: {
                    id: true,
                },

            });


        return usage;

    }



    async auditLogs() {

        return this.prisma.requestLog.findMany({

            orderBy: {
                createdAt:
                    'desc',
            },

            take: 100,

        });

    }


}