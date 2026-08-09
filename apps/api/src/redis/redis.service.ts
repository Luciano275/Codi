import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.client = createClient({
      socket: {
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            this.logger.warn(
              'Redis max reconnection attempts reached. Continuing without Redis.',
            );
            return false;
          }
          this.logger.log(`Redis reconnecting... attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        },
      },
      username: configService.get<string>('redis.user'),
      password: configService.get<string>('redis.password'),
    })

    this.client.on('error', (error) => {
      this.logger.error('Redis error', error);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        'Redis connection failed. Application will continue without Redis.',
        error,
      );
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
      }
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client.isOpen;
  }
}