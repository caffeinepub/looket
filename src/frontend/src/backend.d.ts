import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Blook {
    cost: bigint;
    name: string;
    rarity: string;
}
export interface QuestionSet {
    id: bigint;
    title: string;
    creator: Principal;
    questions: Array<Question>;
    isPublic: boolean;
}
export interface Question {
    id: bigint;
    correctIndex: bigint;
    prompt: string;
    choices: Array<string>;
}
export interface UserProfile {
    xp: bigint;
    name: string;
    equippedBlook?: string;
    coins: bigint;
    ownedBlooks: Array<string>;
}
export interface User {
    id: bigint;
    xp: bigint;
    name: string;
    coins: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addShopBlook(name: string, cost: bigint, rarity: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(user: Principal): Promise<void>;
    buyBlook(blookName: string): Promise<void>;
    createUser(name: string): Promise<void>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeaderboard(): Promise<Array<User>>;
    getQuestionSet(id: bigint): Promise<QuestionSet | null>;
    getShopBlooks(): Promise<Array<[string, Blook]>>;
    getUser(): Promise<User | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    giveCoins(userPrincipal: Principal, amount: bigint): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchQuestionSets(search: string): Promise<Array<QuestionSet>>;
    submitQuestionSet(title: string, questions: Array<Question>): Promise<bigint>;
}
