/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: LoginUsers
// ====================================================

export interface LoginUsers_role {
    __typename: "Roles";
    _id: string;
    name: string;
  }
  
  export interface LoginUsers {
    __typename: "LoginUsers";
    _id: string;
    deleteStatus: boolean | null;
    deleteAt: any | null;
    createdAt: any | null;
    updatedAt: any | null;
    type: string;
    actionScope: string;
    name: string;
    profile: string;
    idType: string;
    idString: string;
    firstName: string;
    lastName: string;
    birthDate: any;
    email: string;
    role: LoginUsers_role | null;
    roleName: string;
  }
  