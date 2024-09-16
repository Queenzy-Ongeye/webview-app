export const TOKEN_STORAGE_KEY = 'OVS_TOKEN_KEY';
export const USER_PREF_STORAGE_KEY = 'OVS_PREF_KEY';
export const USER_TYPE = '@USER_TYPE';
export const USER_TYPES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    DISTRIBUTOR: 'DISTRIBUTOR',
    SALES: 'SALES',
    EXCLUDE_STANDALONE: 'EXCLUDE_STANDALONE',
    SHOW_STANDALONE: 'SHOW_STANDALONE',
    SERVICER: 'SERVICER',
    DISTRIBUTOR_STAFF: "DISTRIBUTOR_STAFF",
    GENERAL_AGENT: "GENERAL AGENT"
};
export const DUMMY_USER = {
    email: 'admin@example.com',
    id: '_id',
    role: 'ADMIN',
    firstName: 'Test',
    lastName: 'Test',
    __typename: 'LoginUsers',
};
