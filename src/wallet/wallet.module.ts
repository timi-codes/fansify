import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UserService } from '../user';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [WalletService, UserService, ConfigService],
  exports: [WalletService],
})
export class WalletModule { }
