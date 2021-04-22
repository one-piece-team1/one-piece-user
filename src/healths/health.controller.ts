import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { config } from '../../config';

@Controller('healths')
export class HealthController {
  constructor(private readonly health: HealthCheckService, private readonly http: HttpHealthIndicator) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.http.pingCheck('User-Services', `${config.PROTOCL}://${config.HOST}:${config.PORT}/users`)]);
  }
}
