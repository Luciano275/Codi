import { Global, Module } from '@nestjs/common';
import { CloudflareSandboxClientService } from './cloudflare-sandbox-client.service';

@Global()
@Module({
  providers: [CloudflareSandboxClientService],
  exports: [CloudflareSandboxClientService],
})
export class SandboxModule {}
