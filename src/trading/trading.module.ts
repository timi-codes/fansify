import { Module } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingResolver } from './trading.resolver';
import { UserService } from '../user';
import { MembershipService } from 'src/membership/membership.service';
import { WalletModule, WalletService } from 'src/wallet';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [WalletModule],
  providers: [TradingService, UserService, MembershipService, WalletService, TradingResolver, ConfigService],
})
export class TradingModule {}
