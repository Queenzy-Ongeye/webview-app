  import { useContext } from 'react';
import { IMessageContext, MessageContext, IMessage } from '../components/messages';
  
  export type UseNotifierResult = IMessageContext;
  
  function useNotifier(): UseNotifierResult {
    const notificationContext: any = useContext(MessageContext);
  
    const notify = (options: IMessage) => {
      notificationContext.show(options);
    };
    return notify;
  }
  
  export default useNotifier;
  