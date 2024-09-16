import { hasExpired, parseJwt } from '../../utility/storeComps';
import { TOKEN_STORAGE_KEY, USER_PREF_STORAGE_KEY } from '../constants/auth';
import { AuthToken } from '../types/AuthToken';
export const getToken = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expired = hasExpired(token);
    if (expired) {
        removeToken();
        if (token) window.location.reload();
    }
    return {
        auth: token,
        userPref: JSON.parse(localStorage.getItem(USER_PREF_STORAGE_KEY) || '{}'),
    };
};


export const getDistributorId = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
        let decodedToken = parseJwt(token)
        return decodedToken.distributorId
    }



}

export const setToken = (token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const setUserPref = (userPref: AuthToken) => {
    localStorage.setItem(USER_PREF_STORAGE_KEY, JSON.stringify(userPref));
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const addToStorage = (key: string, value: string) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getFromStorage = (key: string) => ({
    key: localStorage.getItem(key),
});
