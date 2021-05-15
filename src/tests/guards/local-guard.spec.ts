import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from '../../users/guards/local-guard';
import * as EUser from '../../users/enums/user.enum';

describe('# Role Guard', () => {
  let reflector: Reflector;
  let roleGuard: RoleGuard;
  let useRole: string = 'user';

  const ctxMock = {
    switchToHttp: () => ({
      getRequest: jest.fn().mockReturnValueOnce({ user: { role: useRole } }),
    }),
    getHandler: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        RoleGuard,
      ],
    }).compile();
    reflector = module.get<Reflector>(Reflector);
    roleGuard = module.get<RoleGuard>(RoleGuard);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('# Reflector should be created', () => {
    expect(reflector).toBeDefined();
  });

  it('# RoleGuard should be created', () => {
    expect(roleGuard).toBeDefined();
  });

  describe('# CanActivate', () => {
    it("Should be activate if it's user", (done: jest.DoneCallback) => {
      reflector.get = jest.fn().mockReturnValueOnce([EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN]);
      expect(roleGuard.canActivate(ctxMock)).toEqual(true);
      done();
    });

    it("Should be activate if it's admin", (done: jest.DoneCallback) => {
      reflector.get = jest.fn().mockReturnValueOnce([EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN]);
      useRole = 'admin';
      expect(roleGuard.canActivate(ctxMock)).toEqual(true);
      done();
    });

    it('Should not be activate if rule is malware enumerate', (done: jest.DoneCallback) => {
      reflector.get = jest.fn().mockReturnValueOnce([EUser.EUserRole.USER, EUser.EUserRole.VIP1, EUser.EUserRole.VIP2, EUser.EUserRole.ADMIN]);
      useRole = 'vip4';
      expect(roleGuard.canActivate(ctxMock)).toEqual(false);
      done();
    });
  });
});
