import { NotifierComponents } from "react-native-notifier";

export const getErrorAlert = (error: Error, title: string) => {
  return {
    title,
    description: error.message,
    Component: NotifierComponents.Alert,
    componentProps: {
      alertType: 'error' as 'error' | 'warn' | 'info' | 'success',
    },
    containerStyle: {
      marginTop: 50,
    },
  };
}

export const getInfoAlert = (title: string, description: string) => {
  return {
    title,
    description,
    Component: NotifierComponents.Notification,
    containerStyle: {
      marginTop: 50,
    },
  };
}