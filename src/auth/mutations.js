import { gql } from "@apollo/client";

export const authTokenFragment = gql`
  fragment AuthToken on AuthToken {
    _id
    accessToken
    actionScope
    agentId
    agentType
    authentcationInstance {
      _id
      name
    }
    birthDate
    createdAt
    deleteAt
    deleteStatus
    email
    firstName
    hireDate
    idString
    idType
    lastName
    name
    officeAddress {
      _id
      city
      country
      createdAt
      deleteAt
      deleteStatus
      postcode
      srpc
      street
      unit
      updatedAt
    }
    profile
    role {
      _id
      name
    }
    roleName
    subrole {
      _id
      name
    }
    type
    updatedAt
  }
`;

export const LoginUserFragment = gql `
    fragment LoginUsers on LoginUsers {
        _id
    deleteStatus
    deleteAt
    createdAt
    updatedAt
    type
    actionScope
    name
    profile
    idType
    idString
    firstName
    lastName
    birthDate
    email
    role {
      _id
      name
    }
    roleName 
    }
`;

