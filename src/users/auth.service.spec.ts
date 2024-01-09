import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('hello@gmail.com', 'passwd');

    expect(user.password).not.toEqual('passwd');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if a user signs up with an email already in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '123' } as User]);

    await expect(service.signup('hello@gmail.com', 'passwd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(service.signin('hi@gmail.com', 'trackpass')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws if the user inputs an invalid password', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        { email: 'hello@gmail.com', password: 'passwd' } as User,
      ]);

    await expect(service.signin('hello@gmail.com', 'bropass')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if the correct password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        {
          email: 'hello@gmail.com',
          password:
            '95a18d09218e46a0.f4c85fd048a3ad7831428ee6dfd4daebee0b95b61debdf13671af91799627d66',
        } as User,
      ]);

    const user = await service.signin('hello@gmail.com', 'passwd');
    expect(user.password).toBeDefined();
  });
});
