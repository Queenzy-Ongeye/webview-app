/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum ActionScope {
    CLIENT = "CLIENT",
    DEVELOPMENT = "DEVELOPMENT",
    GLOBAL = "GLOBAL",
    MANAGEMENT = "MANAGEMENT",
    SYSTEM = "SYSTEM",
};

export enum AgentTypes {
    COLLECTION = "COLLECTION",
    SALES = "SALES",
    SERVICE = "SERVICE",
};

export enum PersonalIDTypes {
    DRIVERS_LICENSE = "DRIVERS_LICENSE",
    OFFICIAL_ID = "OFFICIAL_ID",
    PASSPORT = "PASSPORT",
};

export interface SignInCredentialsInput {
    email: string;
    password: string;
};

export interface SignInCredentialsDto {
    email: string;
    password: string;
};

export interface SignUpcredentialsDto {
    firstName: string;
    lastName: string;
    idType: PersonalIDTypes;
    idString: string;
    birthDate: any;
    profile: string;
    email: string;
    authenticationToken?: string | null;
    password: string;
};