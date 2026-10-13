import { Alert } from "react-native";

export function showError(message: string, title = "Ошибка") {
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function showConfirm({
  title,
  message,
  confirmText = "Удалить",
  cancelText = "Отмена",
  destructive = true,
  onConfirm,
}: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}