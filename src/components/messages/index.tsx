import { SnackbarKey } from "notistack";
import { createContext, ReactNode } from "react";

export type Status = "success" | "error" | "info" | "warning";

export interface IMessage {
  actionBtn?: (key: SnackbarKey) => ReactNode;
  title: string;
  text: React.ReactNode;
  onUndo?: () => void;
  status?: Status;
}

export interface INotification {
  id: number;
  message: IMessage;
  timeout: number;
  close: () => void;
}

export interface ITimer {
  id: number;
  notification: INotification;
  remaining: number;
  start: number;
  timeoutId: number;
}

export const types = {
  ERROR: "error",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
};
export interface INotificationContext {
  show: (message: IMessage, timeout?: number | null) => void;
}

export type IMessageContext = (message: IMessage) => void;
export const MessageContext = createContext<INotificationContext>(
  {} as INotificationContext
);
export * from "../messages/MessageManagerProvider";
export {default} from "../messages/MessageManagerProvider";
