import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { UserModule } from './user';
import { Environment, EnvSchema } from './common';
import { AuthModule } from './auth';
import { EncryptionModule } from './encryption';
import { PaymentModule } from './payment';
import { TradingModule } from './trading/trading.module';
import { MembershipModule } from './membership/membership.module';
import { PrismaModule } from './prisma';
import { WalletService } from './wallet/wallet.service';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', validationSchema: EnvSchema }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        playground: false,
          // configService.get<string>('NEST_ENVIRONMENT') ===
          // Environment.Development,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        buildSchemaOptions: { dateScalarMode: 'timestamp' },
      }),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    EncryptionModule,
    PaymentModule,
    TradingModule,
    MembershipModule,
  ],
  providers: [WalletService]
})
export class AppModule {}
