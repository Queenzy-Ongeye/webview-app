import { ApolloClient, useApolloClient, useMutation } from "@apollo/client";
import { useContext, useState } from "react";
import { LoginUsers } from "../types/types";
import useNotifier from "../../hook/useNotifier";
import { handleGQLErrors } from "../utils/gqlErrors";
import { useNavigate } from "react-router-dom";
import { isUndefinedOrNull } from "../../utility/storeComps";
import { USER_PREF_STORAGE_KEY, USER_TYPE, USER_TYPES } from "../constants/auth";
import {
  SignInLoginUser,
  SignInLoginUserVariables,
} from "../types/SignInLoginUser";
import { addToStorage, getDistributorId, getFromStorage, getToken, setToken, setUserPref } from "../utils/utils";
import { signInLoginUserMutation, signUpLoginUserMutation, useSignInClient } from "../mutations";
import _ from "lodash";
import { SignUpCredentialsDto } from "../types/authGlobalTypes";
import { UserContext } from "./authContext";

export const useAuthProvider = (apolloClient: ApolloClient<any>) => {
  const [userContext, setUserContext] = useState<undefined | LoginUsers | null>(
    undefined
  );
  const notify = useNotifier();
  const history = useNavigate();

  const [_signUpDistributor, signUpDistributorOpts] = useMutation<
    SignUpClient,
    SignUpClientVariables
  >(signUpClient, {
    client: clientClientService,
    onCompleted: (data) => {
      notify({
          text: "Signed In successfully. You can now login using your credentails.",
          status: "success",
          title: ""
      });
      // setToken(result.signUpLoginUser); // TODO: store access token after a user is successfully logged in
      window.location.href = "/auth/login-page";
      setTimeout(() => {
        history("/auth/login-page");
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      handleGQLErrors(notify, error);
    },
  });

  const [_signUpStaffAgent, signUpStaffAgentOpts] = useMutation<
    SignUpDistributorStaffAgent,
    SignUpDistributorStaffAgentVariables
  >(signUpStaffAgentMutation, {
    client: clientClientService,
    onCompleted: (data) => {
      notify({
          text: "Signed Up successfully. You can now login using your credentails.",
          status: "success",
          title: ""
      });
      // setToken(result.signUpLoginUser); // TODO: store access token after a user is successfully logged in
      window.location.href = "/auth/login-page";
      setTimeout(() => {
        history("/auth/login-page");
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      handleGQLErrors(notify, error);
    },
  });

  const [signUpLoginUser, signUpLoginUserResult] = useMutation<
    SignUpLoginUser,
    SignUpLoginUserVariables
  >(signUpLoginUserMutation, {
    client: apolloClient,
    onCompleted: (result) => {
      if (result.signUpUser) {
        const user = result.signUpUser;
        setUserContext({
          email: user.email || "",
          _id: user._id,
          __typename: "LoginUsers",
          role: user.role,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          updatedAt: user.updatedAt,
          createdAt: user.createdAt,
          actionScope: user.actionScope || "",
          name: user.name || "",
          profile: user.profile || "",
          idString: user.idString || "",
          idType: user.idType || "",
          type: user.type || "",
          birthDate: user.birthDate || "",
          deleteStatus: user.deleteStatus || false,
          deleteAt: user.deleteAt || "",
          roleName: user.roleName || "",
        });
        notify({
            text: "Signed In successfully. You can now login using your credentails.",
            status: "success",
            title: ""
        });
        // setToken(result.signUpLoginUser); // TODO: store access token after a user is successfully logged in
        setTimeout(() => {
          history("auth/login-page");
        }, 2000);
      }
    },
    onError: (err) => {
      // handle error
      handleGQLErrors(notify, err);
    },
  });

  const [signInLoginUser, signInLoginUserResult] = useMutation<
    SignInLoginUser,
    SignInLoginUserVariables
  >(signInLoginUserMutation, {
    client: apolloClient,
    onCompleted: (result) => {
      if (result.signInUser) {
        const user = result.signInUser;
        const firstName = !isUndefinedOrNull(user?.firstName)
          ? user.firstName
          : user.name || "";
        const lastName = !isUndefinedOrNull(user.lastName) ? user.lastName : "";
        setUserContext({
          email: user.email || "",
          _id: user._id,
          __typename: "LoginUsers",
          role: user.role,
          firstName: firstName || user.firstName || "",
          lastName: lastName || user.lastName || "",
          updatedAt: user.updatedAt,
          createdAt: user.createdAt,
          actionScope: user.actionScope || "",
          name: user.name || "",
          profile: user.profile || "",
          idString: user.idString || "",
          idType: user.idType || "",
          type: user.type || "",
          birthDate: user.birthDate || "",
          deleteStatus: user.deleteStatus || false,
          deleteAt: user.deleteAt || "",
          roleName: user.roleName || "",
        });
        addToStorage(USER_TYPE, result.signInUser.type || "");
        setToken(result?.signInUser?.accessToken || "");
        const rest =
          user.type === USER_TYPES.DISTRIBUTOR
            ? { distributorId: user._id }
            : {};
        setUserPref({ ...user, firstName, lastName, ...rest });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    },
    onError: (error) => {
      handleGQLErrors(notify, error);
    },
  });

  const callbackFn = ({
    response,
    error,
  }: {
    response: SignInClient | undefined;
    error: any;
  }) => {
    if (response) {
      const user = response.signInClient;
      const firstName = !isUndefinedOrNull(user?.firstName)
        ? user.firstName
        : user.name || "";
      const lastName = !isUndefinedOrNull(user.lastName) ? user.lastName : "";
      setUserContext({
        email: user.email || "",
        _id: user._id,
        __typename: "LoginUsers",
        role: null,
        firstName: firstName || user.firstName || "",
        lastName: lastName || user.lastName || "",
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
        actionScope: "",
        name: user.name || "",
        profile: user.profile || "",
        idString: user.idString || "",
        idType: "",
        type: user.type || "",
        birthDate: "",
        deleteStatus: user.deleteStatus || false,
        deleteAt: "",
        roleName: user.roleName || "",
      });
      addToStorage(USER_TYPE, response.signInClient.type || "");
      setToken(response?.signInClient?.accessToken || "");
      // @ts-ignore
      setUserPref({ ...user, firstName, lastName } as AuthToken);
      window.location.reload();
    }
    if (error) {
      notify({
          text: "Email or Password do not match", status: "error",
          title: ""
      });
      setUserContext(null);
    }
  };
  const { mutation } = useSignInClient({ callbackFn });

  const signInOpt = {
    ...signInLoginUserResult,
    ...signUpLoginUserResult,
    ...signUpDistributorOpts,
  };
  const loginClient = async (email: string, password: string) => {
    const result = await mutation({
      variables: { signInCredentialsInput: { email, password } },
    });

    if (result) {
      return result.data?.signInClient.accessToken;
    }
    return null;
  };

  const login = async (email: string, password: string) => {
    const result = await signInLoginUser({
      variables: { signInCredentials: { email, password } },
    });

    if (result) {
      return result.data?.signInUser.accessToken;
    }
    return null;
  };

  const signup = async (credentials: SignUpCredentialsDto) => {
    const result = await signUpLoginUser({
      variables: { signUpCredentials: credentials },
    });

    if (result) {
      return result.data?.signUpUser;
    }
    return null;
  };

  const signUpDistributor = async (input: SignUpClientInput) => {
    await _signUpDistributor({
      variables: {
        signUpClientInput: input,
      },
    });
  };

  const signUpStaffAgent = async (
    input: SignUpDistributorStaffOrAgentInput
  ) => {
    await _signUpStaffAgent({
      variables: {
        signUpDistributorStaffInput: input,
      },
    });
  };

  return {
    login,
    loginClient,
    signInOpt,
    signup,
    userContext,
    signUpDistributor,
    signUpStaffAgent,
    signUpStaffAgentOpts,
  };
};

interface IProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<IProps> = ({ children }) => {
  const apolloClient = useApolloClient();
  const {
    login,
    signInOpt,
    userContext,
    signup,
    signUpDistributor,
    loginClient,
    signUpStaffAgent,
    signUpStaffAgentOpts,
  } = useAuthProvider(apolloClient);

  return (
    <UserContext.Provider
      value={{
        login,
        loginClient,
        isLoading: signInOpt.loading || signUpStaffAgentOpts.loading,
        user: userContext,
        signup,
        signUpDistributor,
        signUpStaffAgent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => {
  const user = useContext(UserContext);
  const isAuthenticated = !!getToken().auth;
  const userPref = getToken().userPref;
  const isServicer = userPref?.type === USER_TYPES.SERVICER;
  const isDistributor =
    userPref?.roleName === USER_TYPES.DISTRIBUTOR ||
    userPref?.subrole?.name === USER_TYPES.DISTRIBUTOR_STAFF ||
    userPref?.subrole?.name === USER_TYPES.GENERAL_AGENT;
  const isDistributorStaff =
    userPref?.subrole?.name === USER_TYPES.DISTRIBUTOR_STAFF;
  const isSuperAdmin = userPref?.roleName === USER_TYPES.SUPER_ADMIN;
  const selectedDistributorId = JSON.parse(
    _.get(getFromStorage(USER_PREF_STORAGE_KEY), "key") || "{}"
  ).distributorId;
  const loggedInUserId = userPref?._id;
  const disableFreeCode = ["619fd1cb710fe95425f24a21"].includes(loggedInUserId);
  const distributorId = getDistributorId();
  return {
    hastoken: !!getToken().auth,
    user: user.user,
    isAuthenticated,
    isLoading: user.isLoading,
    userPref,
    isDistributor,
    isServicer,
    loggedInUserId,
    disableFreeCode,
    selectedDistributorId,
    isSuperAdmin,
    isDistributorStaff,
    distributorId,
  };
};

export default AuthProvider;
