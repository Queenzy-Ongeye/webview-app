import { ApolloError } from '@apollo/client';
import * as _ from 'lodash';
import { IMessageContext } from '../../components/messages';
interface IError {
    exception: {
        response: {
            message: string[];
        };
    };
}

export const handleGQLErrors = (
    notify: IMessageContext,
    errors: ApolloError
) => {
    try {

        const statusCode: any = _.get(errors, 'networkError.statusCode')
        const errorsMessage = errors.message

        if ([504, 521].includes(parseInt(statusCode || '0'))) {

            window.location.href = '/admin/error-page'
        }

        // logout users if the server is unresponsive
        if (_.get(errors, 'graphQLErrors', []).length === 0) {
            if (errorsMessage) {
                return notify({
                    status: 'error', text: errorsMessage,
                    title: ''
                });
            }
            window.location.href = '/admin/error-page'
        }
        if (Array.isArray(errors.graphQLErrors)) {
            if (_.get(errors, 'graphQLErrors[0].extensions.code') === 'INTERNAL_SERVER_ERROR') {
                let text;
                if (errors.message) {
                    text = errors.message
                }
                else {
                    text = 'Internal server error. Please contact support if the error persist.'
                }
                return notify({
                    status: 'error', text: text,
                    title: ''
                });
            }
        }


        if (errors.graphQLErrors.length > 0) {

            const _err = // @ts-ignore
                errors?.graphQLErrors[0]?.extensions?.response?.message || [];
            if (_err.length) {
                if (typeof _err === 'string') {
                    if (_err === 'Invalid Credentials') {
                        notify({
                            status: 'error',
                            text: 'Email or Password do not match',
                            title: ''
                        });
                        return;
                    }
                    notify({
                        status: 'error', text: _err,
                        title: ''
                    });
                } else {
                    notify({
                        status: 'error', text: _err[0],
                        title: ''
                    });
                }

                return;
            }
        }


        if (errors.message === 'Unauthorized') {
            notify({
                status: 'error',
                text: 'You are unauthorized to access this page',
                title: ''
            });
            return;
        }
        errors.graphQLErrors.map((error) => { // @ts-ignore
            const exception = error?.extensions as IError;
            const messages = exception?.exception?.response?.message || [];
            if (typeof messages === 'string') {
                notify({
                    text: messages, status: 'error',
                    title: ''
                });
                return null;
            }
            if (messages) {
                return messages.map((msg) => notify({
                    text: msg, status: 'error',
                    title: ''
                }));
            } else {
                return '';
            }
        });

        if (errors.message && errors.graphQLErrors?.length) {
            if (errors.message === 'Bad Request Exception') return;
            return notify({
                status: 'error', text: errors.message,
                title: ''
            });
        }

        if (errors.graphQLErrors.length === 0)
            return notify({
                text: 'An error occured', status: 'error',
                title: ''
            });
    } catch (error) {
        notify({
            status: 'error',
            text: 'Some error occurred!',
            title: ''
        });
    }
};

export const isNetworkError = (error: unknown) => {
    return (
        error instanceof ApolloError &&
        error.message === 'Network request failed' &&
        error.graphQLErrors.length === 0 &&
        error.networkError &&
        Object.keys(error.networkError).length === 0
    );
};
