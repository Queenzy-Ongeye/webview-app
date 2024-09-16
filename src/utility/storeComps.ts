import React from 'react';
import * as _ from 'lodash';

export const getPaginationPage = (page: number, total: number) => {
    const max = 5;
    let left = [page - 2, page - 1];
    const current = [page];
    const right = [page + 1, page + 2];
    let pages = [...left, ...current, ...right].filter(
        (item) => item >= 1 && item <= total
    );

    if (pages.length >= max || total < max) {
        return pages;
    }
    if (pages.length < max) {
        page = pages[pages.length - 1] >= total ? pages[0] : page + 1;
        pages = getPaginationPage(page, total);
        return pages;
    }
    return pages;
};

export const numberWithCommas = (x: number | string) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export function useStateCallback(initialState: any) {
    const [state, setState] = React.useState(initialState);
    const cbRef = React.useRef(null); // mutable ref to store current callback

    const setStateCallback = React.useCallback((state: any, cb: any) => {
        cbRef.current = cb; // store passed callback to ref
        setState(state);
    }, []);

    React.useEffect(() => {
        // cb.current is `null` on initial render, so we only execute cb on state *updates*
        if (cbRef.current) {
            // @ts-ignore
            cbRef?.current(state);
            cbRef.current = null; // reset callback after execution
        }
    }, [state]);

    return [state, setStateCallback];
}

export const isUndefinedOrNull = (value: string | null) => {
    return value === null || value === undefined ? true : false;
};

export function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload);
}

export const hasExpired = (token: string | null) => {
    if (!token) {
        return true;
    }
    try {
        return new Date(parseJwt(token)?.exp * 1000) <= new Date();
    } catch (error) {
        return true;
    }
};

export interface ISelectOption {
    _id: string;
    name: string;
}

export const parsePaginationOffset = (
    num: number | undefined,
    increment: number
) => {
    if (!num) return increment;
    return num + increment;
};

export function tryParseJSONObject(str: any) {
    try {
        if (!str) return false;
        if (/^\s*$/.test(str)) return false; // eslint-disable-next-line
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(
            // eslint-disable-next-line
            /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
            ']'
        );
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return /^[\],:{}\s]*$/.test(str);
    } catch (error) {
        return false;
    }
}

export function replaceAll(str: string, find: string, replace: string) {
    return str?.toString().replace(new RegExp(find, 'g'), replace);
}

export const titleCase = (str: string) => {
    if (str) {
        return _.startCase(_.toLower(str));
    }
    return str;
};

export const format2DP = (num: number) => {
    return _.round(num, 2).toFixed(2)
}