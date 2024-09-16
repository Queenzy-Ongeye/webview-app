import { gql, useMutation } from '@apollo/client';
import useNotifier from 'hooks/useNotifier';
import clientSimulator from 'utils/clientSimulator';
import { SignInClient, SignInClientVariables } from './types/SignInClient';
import { handleGQLErrors } from './utils/gqlErrors';

/**
 * type AuthAddress {
_id: ID!
city: String!
country: String!
createdAt: DateTime
deleteAt: DateTime
deleteStatus: Boolean
postcode: String!
srpc: String!
street: String!
unit: String!
updatedAt: DateTime
}
 */

export const authAddressFragment = gql`
  fragment AuthAddress on AuthAddress {
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
`;

/**
 * type AuthToken {
_id: ID!
accessToken: String
actionScope: ActionScope
agentId: String
agentType: AgentTypes
authenticationInstance: AuthenticationInstance
birthDate: DateTime
createdAt: DateTime
deleteAt: DateTime
deleteStatus: Boolean
email: String
firstName: String
hireDate: DateTime
idString: String
idType: PersonalIDTypes
lastName: String
name: String
officeAddress: AuthAddress
profile: String
role: Roles
roleName: String
subrole: SubRoles
type: String
updatedAt: DateTime
}
 */
export const authTokenFragment = gql`
  fragment AuthToken on AuthToken {
    _id
    accessToken
    actionScope
    agentId
    agentType
    authenticationInstance {
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

/*
 Sign in Login User
 mutation {
 signInLoginUser (signInCredentials: { email: "paul@gmail.com", password: "P@ulkinut1a"}) {
    accessToken
  }
}
/*/
export const signInLoginUserMutation = gql`
  ${authTokenFragment}
  mutation SignInLoginUser($signInCredentials: SignInCredentialsDto!) {
    signInUser(signInCredentials: $signInCredentials) {
      ...AuthToken
    }
  }
`;
/**
signUpUser(
signUpCredentials: SignUpCredentialsDto!
): AccessToken!
 */
export const signUpLoginUserMutation = gql`
  ${authTokenFragment}
  mutation SignUpLoginUser($signUpCredentials: SignUpCredentialsDto!) {
    signUpUser(signUpCredentials: $signUpCredentials) {
      ...AuthToken
    }
  }
`;

/**
 * type LoginUsers {
_id: ID!
deleteStatus: Boolean
deleteAt: DateTime
createdAt: DateTime
updatedAt: DateTime
type: String!
actionScope: String!
name: String!
profile: String!
idType: String!
idString: String!
firstName: String!
lastName: String!
birthDate: DateTime!
email: String!
role: Roles
roleName: String!
authenticationInstance: AuthenticationInstance!
activeSubRolePermission: PermissionInput!
}
 */
export const LoginUsersFragment = gql`
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

/**
 * signInClient(
signInCredentialsInput: SignInCredentialsInput!
): AccessToken!
 */
const signInClientMutation = gql`
  mutation SignInClient($signInCredentialsInput: SignInCredentialsInput!) {
    signInClient(signInCredentialsInput: $signInCredentialsInput) {
      accessToken
      _id
      email
      name
      firstName
      lastName
      role
      updatedAt
      createdAt
      profile
      idString
      type
      deleteStatus
      roleName
    }
  }
`;

export const useSignInClient = ({
  callbackFn,
}: {
  callbackFn: ({
    response,
    error,
  }: {
    response: SignInClient | undefined;
    error: any;
  }) => void;
}) => {
  const notify = useNotifier();
  const [mutation, mutationOps] = useMutation<
    SignInClient,
    SignInClientVariables
  >(signInClientMutation, {
    client: clientSimulator,
    onCompleted: (data) => {
      if (data) {
        callbackFn({ response: data, error: undefined });
        notify({ text: 'Logged in successfully', status: 'success' });
      } else {
        callbackFn({ response: undefined, error: {} }); 
      }
     
    },
    onError: (error) => {
      // callbackFn({ response: undefined, error });
      handleGQLErrors(notify, error)
    },
  });
  return {
    mutation,
    loading: mutationOps.loading,
    error: mutationOps.error,
  };
};
