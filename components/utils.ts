import { NotifierComponents } from "react-native-notifier";

export const getErrorAlert = (error: Error, title: string) => {
  return {
    title,
    description: error.message,
    Component: NotifierComponents.Alert,
    duration: 5000,
    componentProps: {
      alertType: "error" as "error" | "warn" | "info" | "success",
    },
    containerStyle: {
      marginTop: 60,
    },
  };
};

export const getInfoAlert = (title: string, description: string) => {
  return {
    title,
    description,
    duration: 5000,
    Component: NotifierComponents.Notification,
    containerStyle: {
      marginTop: 60,
    },
  };
};
