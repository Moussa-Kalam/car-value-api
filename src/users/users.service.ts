import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string) {
    // Instance of User Entity
    const user = this.repo.create({ email, password });

    // Persist the user in db with the user entity instance
    return this.repo.save(user);
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  find(email: string) {
    return this.repo.find({ where: { email } });
  }

  async update(id: number, attrs: Partial<User>) {
    // Get the user with the given id from the db
    const user = await this.findOne(id);

    if (!user) throw new Error('User not found');

    // Update the user object with input data
    Object.assign(user, attrs);

    // Save the updated user object to the db
    return this.repo.save(user);
  }
}
