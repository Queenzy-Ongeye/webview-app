import React, { ReactNode, useCallback } from "react";

import { MessageContext } from ".";
import { SnackbarKey, useSnackbar, VariantType } from "notistack";
import { IProps } from "./types";

interface IMessageProps {
  actionBtn?: (key: SnackbarKey) => ReactNode | undefined;
  status?: VariantType;
  text: ReactNode;
}

const MessageManagerProvider: React.FC<IProps> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const show = useCallback(
    (message: IMessageProps) => {
      const { actionBtn, status = "info", text } = message;

      enqueueSnackbar(text, {
        variant: status,
        preventDuplicate: true,
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "center",
        },
        action: actionBtn,
      });
    },
    [enqueueSnackbar]
  );

  return (
    <MessageContext.Provider value={{ show }}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageManagerProvider;
