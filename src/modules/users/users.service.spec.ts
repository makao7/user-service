import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import UsersRepository from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuid } from 'uuid';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';

describe('UsersService', () => {
  const createUserData: CreateUserDto = {
    name: 'user',
    email: 'user@gmail.com',
    password: 'password',
  };
  let usersService: UsersService;
  let createUserMock: jest.Mock;

  beforeEach(async () => {
    createUserMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: createUserMock,
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('create method', () => {
    it('should be called with expected params', async () => {
      const createUserSpy = jest.spyOn(usersService, 'create');

      await usersService.create(createUserData);

      expect(createUserSpy).toHaveBeenCalledWith(createUserData);
    });

    describe('when successfully create user', () => {
      let createdUser: User;

      beforeEach(async () => {
        createdUser = {
          id: uuid(),
          name: 'user',
          email: 'user@gmail.com',
          password:
            '$2b$10$wd2FKgUyIztkelRHpkX7RuJN2ZgVMFBTr/BABiaqkSzDs3eZR9YWO',
        };
      });

      it('should return created user data', async () => {
        createUserMock.mockResolvedValue(createdUser);

        const result = await usersService.create(createUserData);

        expect(result).toEqual(createdUser);
      });
    });

    describe('when user already exists', () => {
      it('should throw conflict exception', async () => {
        createUserMock.mockRejectedValue(
          new ConflictException('User already exists'),
        );

        await expect(usersService.create(createUserData)).rejects.toThrow(
          new ConflictException('User already exists'),
        );
      });
    });

    describe('when required field is empty', () => {
      it('should throw bad request exception', async () => {
        createUserMock.mockRejectedValue(
          new BadRequestException('Some fields are empty'),
        );

        await expect(usersService.create(createUserData)).rejects.toThrow(
          new BadRequestException('Some fields are empty'),
        );
      });
    });

    describe('when created password hash is invalid', () => {
      it('should throw internal server error exception', async () => {
        jest
          .spyOn(usersService, 'hashPassword')
          .mockRejectedValue(
            new InternalServerErrorException('Cannot hash password'),
          );

        await expect(usersService.create(createUserData)).rejects.toThrow(
          new InternalServerErrorException('Cannot hash password'),
        );
      });
    });
  });
});
