import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';

import { User, UpdateUserDocument, UserDocument } from '../schemas/user.schema';
import type { ItemOrArray } from '../types/common.types';
import { User as UserDto } from '../dto/user';
import { LoginProviders, SERVICE, UserRoles, UserStatus, UserSubscriptions } from '../helpers/constants';
import { SubscriptionDocument } from 'src/schemas/subscription.schema';
import { JwtService } from '@nestjs/jwt';
import { CustomLoggerService } from 'src/services/logging/custom-logger.service';
import { SomethingWentWrongException } from 'src/exceptions/general.error';

type FindFilters = {
  _id?: ItemOrArray<Types.ObjectId>;
  username?: ItemOrArray<string>;
  email?: ItemOrArray<string>;
  phone?: ItemOrArray<string>;
  password?: ItemOrArray<string>;
  provider?: ItemOrArray<LoginProviders>;
  token?: ItemOrArray<string>;
  roles?: ItemOrArray<Types.ObjectId>;
  status?: ItemOrArray<UserStatus>;
  subscription?: string | SubscriptionDocument;
};

@Injectable()
export class UserRepository {
  private readonly logger = new CustomLoggerService(SERVICE, UserRepository.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}
  
  generateRandomToken(length) {
    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  generateJwt = (payload) => this.jwtService.sign(payload);

  parseUserInfo(userDocument: UserDocument): UserDto {
    return {
      id:userDocument._id.toString(),
      username: userDocument.username,
      email: userDocument.email,
      phone: userDocument.phone,
      fullname: userDocument.fullname,
      roles: userDocument.roles?.map(r => ({id: r['_id'], name: r['name']})) ?? [],
      dob: userDocument.dob,
      gender: userDocument.gender,
      picture: userDocument.picture,
      bio: userDocument.bio,
      cover: userDocument.cover,
      gallery: userDocument.gallery,
      education: {
        title: userDocument.education?.['title'],
        field: userDocument.education?.['field']
      },
      job: {
        title: userDocument.job?.['title'],
        industry: userDocument.job?.['industry']
      },
      personals: {
        relationship: userDocument.personals?.['relationship'],
        haveKids: userDocument.personals?.['haveKids'],
        kids: userDocument.personals?.['kids'],
      },
      preferences: {
        age: userDocument.preferences?.['age'],
        height: userDocument.preferences?.['height'],
        eyeColor: userDocument.preferences?.['eyeColor'],
        hairColor: userDocument.preferences?.['hairColor'],
      },
      primaryLanguage: userDocument.primaryLanguage,
      otherLanguages: userDocument.otherLanguages,
      interests: userDocument.interests?.map(i => ({id: i['_id'], name: i['name']})) ?? [],
      status: userDocument.status,
      subscription: {
        name: userDocument.subscription?.['name'],
        validity: userDocument.subscription?.['validity'],
        type: userDocument.subscription?.['type'],
        active: userDocument.subscription?.['active'],
        expiresAt: userDocument.subscription?.['expiresAt']
      },
      address: {
        address: userDocument.address?.['address'],
        city: userDocument.address?.['city'],
        state: userDocument.address?.['state'],
        zip: userDocument.address?.['zip'],
        country: userDocument.address?.['country'],
        geolocation: userDocument.address?.['geolocation']
      }
    }
  }

  /**
   * Inserts the users into the database.
   * @param user - An array of users to insert.
   * @returns Number of inserted documents.
   */
  async bulkInsert(user: UserDto[]): Promise<Number> {
    try {
      const results =  await this.userModel.bulkSave(
        user.map(
          dto =>
            new this.userModel({
              email: dto.email ?? '',
              phone: dto.phone ?? '',
              password: dto.password ?? '',
              fullname: dto.fullname,
              dob: dto.dob,
              gender: dto.gender,
              roles: dto.roles ?? [],
              status: dto.status ?? UserStatus.UNVERIFIED,
              picture: dto.picture ?? '',
              provider: dto.provider ?? LoginProviders.SOCIAL_APP,
              token: this.generateRandomToken(32),
              subscription: {
                id: dto.subscription?.id,
                name: dto.subscription?.name ?? UserSubscriptions.BASIC,
                type: dto.subscription?.type ?? UserRoles.INDIVIDUAL,
                validity: dto.subscription?.validity ?? 30,
                active: dto.subscription?.active ?? true,
                expiresAt: dto.subscription?.expiresAt ?? new Date(new Date().setMonth(new Date().getMonth() + 1))
              },
              address: {
                address: dto.address?.address ?? "",
                city: dto.address?.city ?? "",
                state: dto.address?.state ?? "",
                zip: dto.address?.zip ?? "",
                country: dto.address?.country ?? "",
                geolocation: {
                  latitude: dto.address?.geolocation?.latitude ?? 0,
                  longitude: dto.address?.geolocation?.longitude ?? 0
                }
              },
              updatedAt: new Date(),
              createdAt: new Date()
            })
        )
      );
      return results.insertedCount;
    } catch (error) {
      const details = `Error while inserting user record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }

  /**
   * Find and update user data.
   * @param updateUserDTO - An object or an array of object reprsenting the user data to be updated.
   * @returns An array of JSON objects representing the updated users
   */
  async update(updateUserDTO: ItemOrArray<UpdateUserDocument>): Promise<Array<UserDocument>> {
    const dtoArray = Array.isArray(updateUserDTO) ? updateUserDTO : [updateUserDTO];

    return await Promise.all(
      dtoArray.map(async dto => {
        const { _id, ...update } = dto;
        try {
          return await this.userModel.findOneAndUpdate({ _id }, update, {
            new: true,
            runValidators: true
          })
          .populate([
            { path: 'roles', select: '_id name displayName description' },
            { path: 'interests', select: '_id name' }
          ])
          .exec();
        } catch (error) {
          const details = `Error while updating user record: ${error.message}`;
          this.logger.error(details);
          throw new SomethingWentWrongException(details);
        }
      })
    );
  }

  /**
   * Find all User documents in the database, optionally filtered by user info.
   * @param _id - Optional. Return specified user by id
   * @param username - Optional. Return specified user by username
   * @param email - Optional. Return specified user by email
   * @param phone - Optional. Return specified user by phone number
   * @param password - Optional. Return specified user by password
   * @param provider - Optional. Return specified user by login provider
   * @param token - Optional. Return specified user by access token
   * @param roles - Optional. Return specified user by roles
   * @param status - Optional. Return specified user by status
   * @returns An array of JSON objects representing the found Users
   */
  async findAll({ _id, username, email, phone, password, provider, token, roles, status, subscription }: FindFilters): Promise<Array<UserDocument>> {
    try{
      const query: FilterQuery<UserDocument> = {
        ...(_id ? { _id } : {}),
        ...(username ? { username: { $in: Array.isArray(username) ? username : [username] } } : {}),
        ...(email ? { email: { $in: Array.isArray(email) ? email : [email] } } : {}),
        ...(phone ? { phone: { $in: Array.isArray(phone) ? phone : [phone] } } : {}),
        ...(password ? { password: { $in: Array.isArray(password) ? password : [password] } } : {}),
        ...(provider ? { provider: { $in: Array.isArray(provider) ? provider : [provider] } } : {}),
        ...(token ? { token: { $in: Array.isArray(token) ? token : [token] } } : {}),
        ...(roles ? { roles: { $in: Array.isArray(roles) ? roles : [roles] } } : {}),
        ...(status ? { status: { $in: Array.isArray(status) ? status : [status] } } : {}),
        ...(subscription ? { subscription } : {}),
      };

      return await this.userModel.find(query).populate([
        {
          path: 'roles',
          select: '_id name displayName description'
        },
        {
          path: 'interests',
          select: '_id name'
        }
      ]).exec();
    }
    catch (error) {
      const details = `Error while finding user record: ${error.message}`;
      this.logger.error(details);
      throw new SomethingWentWrongException(details);
    }
  }
}
