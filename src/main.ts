import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await app.startAllMicroservices();
  await app.listen(3002);

  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: './src/proto/auth.proto',
        url: 'localhost:50002',
      },
    },
  );
  await grpcApp.listen();
  console.log('Auth service started');
}
bootstrap();
