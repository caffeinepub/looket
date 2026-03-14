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
export interface AdminUser {
    id: bigint;
    xp: bigint;
    name: string;
    coins: bigint;
    principalText: string;
    suspended: boolean;
}
export interface RoomPlayerInfo {
    name: string;
    score: bigint;
}
export interface RoomState {
    code: string;
    questionSetId: bigint;
    hostName: string;
    players: Array<RoomPlayerInfo>;
    status: string;
    currentQuestion: bigint;
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
    createRoom(questionSetId: bigint): Promise<string>;
    createUser(name: string): Promise<void>;
    getAllUsers(): Promise<Array<AdminUser>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeaderboard(): Promise<Array<User>>;
    getQuestionSet(id: bigint): Promise<QuestionSet | null>;
    getRoomState(code: string): Promise<RoomState | null>;
    getShopBlooks(): Promise<Array<[string, Blook]>>;
    getUser(): Promise<User | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    giveCoins(userPrincipal: Principal, amount: bigint): Promise<void>;
    giveCoinsToName(name: string, amount: bigint): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isUserSuspended(user: Principal): Promise<boolean>;
    joinRoom(code: string): Promise<void>;
    leaveRoom(code: string): Promise<void>;
    nextQuestion(code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchQuestionSets(search: string): Promise<Array<QuestionSet>>;
    startRoom(code: string): Promise<void>;
    submitQuestionSet(title: string, questions: Array<Question>): Promise<bigint>;
    submitRoomAnswer(code: string, questionIdx: bigint, answerIdx: bigint): Promise<void>;
    suspendUser(user: Principal, hours: bigint): Promise<void>;
    unsuspendUser(user: Principal): Promise<void>;
}
