import { Global, Module } from '@nestjs/common';
import { BoxLeasePool } from './box-lease-pool.service';

@Global()
@Module({
  providers: [BoxLeasePool],
  exports: [BoxLeasePool],
})
export class SandboxModule {}
