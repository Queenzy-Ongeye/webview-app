
import React from 'react';
import { SignUpCredentialsDto } from '../types/authGlobalTypes';
import { SignUpClientInput, SignUpDistributorStaffOrAgentInput } from '../types/clientServiceTypes';
import { LoginUsers } from '../types/types';

interface IUserContext {
    login: (email: string, password: string) => void;
    loginClient: (email: string, password: string) => void;
    signup: (credentials: SignUpCredentialsDto) => void;
    signUpDistributor: (signUpClientInput: SignUpClientInput) => void;
    signUpStaffAgent: (signUpDistributorStafforAgentInput: SignUpDistributorStaffOrAgentInput) => void;
    user?: LoginUsers | null | undefined;
    isLoading?: boolean;
}

export const UserContext = React.createContext<IUserContext>(
    {} as IUserContext
);
