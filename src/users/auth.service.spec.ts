import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    // Create a fake copy of the users service
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },

      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;

        users.push(user);
        return Promise.resolve(user);
      },
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
    await service.signup('hello@gmail.com', 'passwd');

    const user = await service.signin('hello@gmail.com', 'passwd');
    expect(user.password).toBeDefined();
  });
});
