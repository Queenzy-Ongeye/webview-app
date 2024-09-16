/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ActionScope, AgentTypes, PersonalIDTypes } from "./authGlobalTypes";

// ====================================================
// GraphQL fragment: AuthToken
// ====================================================

export interface AuthToken_authenticationInstance {
    __typename: "AuthenticationInstance";
    _id: string;
    name: string;
}

export interface AuthToken_officeAddress {
    __typename: "AuthAddress";
    _id: string;
    city: string;
    country: string;
    createdAt: any | null;
    deleteAt: any | null;
    deleteStatus: boolean | null;
    postcode: string;
    srpc: string;
    street: string;
    unit: string;
    updatedAt: any | null;
}

export interface AuthToken_role {
    __typename: "Roles";
    _id: string;
    name: string;
}

export interface AuthToken_subrole {
    __typename: "SubRoles";
    _id: string;
    name: string | null;
}

export interface AuthToken {
    __typename: "AuthToken";
    _id: string;
    accessToken: string | null;
    actionScope: ActionScope | null;
    agentId: string | null;
    agentType: AgentTypes | null;
    authenticationInstance: AuthToken_authenticationInstance | null;
    birthDate: any | null;
    createdAt: any | null;
    deleteAt: any | null;
    deleteStatus: boolean | null;
    email: string | null;
    firstName: string | null;
    hireDate: any | null;
    idString: string | null;
    idType: PersonalIDTypes | null;
    lastName: string | null;
    name: string | null;
    officeAddress: AuthToken_officeAddress | null;
    profile: string | null;
    role: AuthToken_role | null;
    roleName: string | null;
    subrole: AuthToken_subrole | null;
    type: string | null;
    updatedAt: any | null;
}
