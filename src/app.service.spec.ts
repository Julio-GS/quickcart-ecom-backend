import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppService } from '@/app.service';

describe('AppService', () => {
  let service: AppService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                NODE_ENV: 'test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthCheck', () => {
    it('should return health check object with required properties', () => {
      // Arrange & Act
      const result = service.getHealthCheck();

      // Assert
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('version');

      expect((result as any).message).toBe(
        'QuickCart E-commerce API is running successfully',
      );
      expect((result as any).environment).toBe('test');
      expect((result as any).version).toBe('1.0.0');
      expect((result as any).timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should call configService.get with correct parameters', () => {
      // Arrange
      const getSpy = jest.spyOn(configService, 'get');

      // Act
      service.getHealthCheck();

      // Assert
      expect(getSpy).toHaveBeenCalledWith('NODE_ENV', 'development');
    });
  });
});
