import { getAsBoolean, getAsNumber } from './environment';

export const SERVICE = 'social-app-backend';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

const SEPARATOR = ':';
const GLOBAL_PREFIX = 'Social App';
export const MQ_PREFIX = [GLOBAL_PREFIX, process.env.GLOBAL_MQ_PREFIX ?? 'MQ'].join(SEPARATOR);

const CACHE_PREFIX = [GLOBAL_PREFIX, process.env.GLOBAL_CACHE_PREFIX ?? 'Cache'].join(SEPARATOR);
const prefixCacheKey = (keys: Array<string>) => [CACHE_PREFIX, ...keys].join(SEPARATOR);

export enum BaseCacheKey {
  UNITS = 'units',
  VALUES = 'values',
  USERS = 'users'
}

export enum UserRoles {
  BUSINESS = 'BUSINESS',
  INDIVIDUAL = 'INDIVIDUAL'
}



export const SEARCH_SCOPE = {
  USERS: 'users',
  POSTS: 'posts',
  BUSINESSES: 'businesses',
  ALL: 'all'
} as const;

export type SearchScope = typeof SEARCH_SCOPE[keyof typeof SEARCH_SCOPE];


export const MEDIA_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video'
} as const;

export type MediaType = typeof MEDIA_TYPE[keyof typeof MEDIA_TYPE];

export const FRIEND_ACTION = {
  SEND_REQUEST: 'send_request',
  ACCEPT_REQUEST: 'accept_request',
  DECLINE_REQUEST: 'decline_request',
  REMOVE_FRIEND: 'remove_friend'
} as const;

export type FriendAction = typeof FRIEND_ACTION[keyof typeof FRIEND_ACTION];
export enum UserStatus {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED'
}

export enum UserEducation {
  HIGH_SCHOOL = 'High school',
  BACHELOR = 'Bachelor',
  MASTER = 'Master',
  PHD = 'PhD',
  OTHER = 'Other'
}

export enum UserEducationField {
  SCIENCE = 'Science',
  ART = 'Art',
  PSYCHOLOGY = 'Psychology',
  LANGUAGE = 'Language',
  TEACHING = 'Teaching',
  ADMINISTRATION = 'Administration',
  OTHER = 'Other'
}

export enum UserJobIndustry {
  IT = 'IT',
  FINANCE = 'Finance',
  EDUCATION = 'Education',
  HEALTHCARE = 'Healthcare',
  OTHER = 'Other'
}

export enum UserRelationship {
  SINGLE = 'Single',
  IN_A_RELATIONSHIP = 'In a relationship',
  MARRIED = 'Married'
}

export enum PreferredEyeColor {
  BLUE = 'Blue',
  GREEN = 'Green',
  HAZEL = 'Hazel',
  BLACK = 'Black',
  ANY = 'Any'
}

export enum PreferredHairColor {
  RED = 'Red',
  BLONDE = 'Blonde',
  BLACK = 'Black',
  BROWN = 'Brown',
  ANY = 'Any'
}

export enum LoginProviders {
  SOCIAL_APP = 'social-app',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin'
}

export enum IndividualPlans {
  BASIC = 'BASIC',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  VIP = 'VIP'
}

export enum BusinessPlans {
  LOCAL = 'LOCAL',
  REGIONAL = 'REGIONAL',
  NATIONAL = 'NATIONAL',
  GLOBAL = 'GLOBAL'
}

export const enum SubscriptionFeatures {
  ADVANCED_CONTROLS = 'ADVANCED_CONTROLS',
  CONTENT_MANAGEMENT = 'CONTENT_MANAGEMENT',
  TRACKING = 'TRACKING',
  PRIVACY_CONTROLS = 'PRIVACY_CONTROLS',
  EXCLUSIVE_ACCESS = 'EXCLUSIVE_ACCESS'
}

export const UserSubscriptions = { ...IndividualPlans, ...BusinessPlans } as const;
export type UserSubscriptions = typeof UserSubscriptions[keyof typeof UserSubscriptions];

export const enum VerificationTypes {
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  RESET_PASSWORD = 'RESET_PASSWORD'
}

export const enum ReferralTypes {
  STUDENT = 'STUDENT',
  BUSINESS = 'BUSINESS'
}

export const DEFAULT_REFERRAL_EXPIRY_HOURS = getAsNumber('REFERRAL_EXPIRY_HOURS', 48);
export const TWILIO_ENABLED = getAsBoolean('TWILIO_ENABLED');

const CacheKeyFunctions = {
  UNITS: (unit: string) => prefixCacheKey([BaseCacheKey.UNITS, unit]),
  VALUES: (value: string) => prefixCacheKey([BaseCacheKey.VALUES, value]),
  USERS_BY_ROLE: (role: string) => prefixCacheKey([BaseCacheKey.USERS, role])
};
export const CacheKey = Object.freeze(CacheKeyFunctions);

export const enum CacheTTL {
  SECONDS_30 = 30 * 1000,
  MINUTES_5 = 5 * 60 * 1000,
  MINUTES_15 = 15 * 60 * 1000,
  HOURS_1 = 60 * 60 * 1000,
  HOURS_6 = 6 * 60 * 60 * 1000,
  HOURS_12 = 12 * 60 * 60 * 1000,
  HOURS_24 = 24 * 60 * 60 * 1000
}
export const DEFAULT_CACHE_TTL = getAsNumber('DEFAULT_CACHE_TTL', CacheTTL.HOURS_6);

export const DEFAULT_BATCH_SIZE = 200;

export const ISO_8601_DATE_REGEX = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
export const ISO_8601_DATE_TIME_REGEX =
  /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;

export const HOME_FEED_DEFAULT_LIMIT = 20;
export const HOME_STORIES_LIMIT = 20;
export const HOME_RECOMMENDED_BUSINESS_LIMIT = 10;

export const SOCKET_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  PRESENCE_GET: 'presence:get',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_ONLINE: 'presence:online',
  PRESENCE_OFFLINE: 'presence:offline',
  CHAT_SEND: 'chat:send',
  CHAT_MESSAGE: 'chat:message',
  CALL_START: 'call:start',
  CALL_STARTED: 'call:started',
  CALL_END: 'call:end',
  CALL_ENDED: 'call:ended',
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  SOCKET_ERROR: 'socket:error'
} as const;
