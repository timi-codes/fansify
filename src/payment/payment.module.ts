import { Module } from '@nestjs/common';
import { PaymentResolver } from './payment.resolver';
import { MembershipService } from 'src/membership/membership.service';
import { WalletService } from 'src/wallet';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';

@Module({
  providers: [MembershipService, WalletService, ConfigService, UserService, PaymentResolver]
})
export class PaymentModule {}
