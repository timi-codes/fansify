import { Module } from '@nestjs/common';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';
import { WalletService } from 'src/wallet';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';

@Module({
  providers: [MembershipResolver, MembershipService, WalletService, ConfigService, UserService],
  exports: [MembershipService],
})
export class MembershipModule {}