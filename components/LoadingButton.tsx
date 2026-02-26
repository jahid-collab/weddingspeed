import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { colors } from "@/styles/commonStyles";

// ─── LoadingButton ────────────────────────────────────────────────────────────

interface LoadingButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingColor?: string;
}

export function LoadingButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
  loadingColor,
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={loadingColor || (variant === "outline" ? "#007AFF" : "#fff")}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text` as keyof typeof styles],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: "#007AFF",
  },
  secondary: {
    backgroundColor: "#5856D6",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#fff",
  },
  outlineText: {
    color: "#007AFF",
  },
});

// ─── AppModal ────────────────────────────────────────────────────────────────

export interface ModalAction {
  label: string;
  onPress: () => void;
  style?: "default" | "destructive" | "cancel";
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actions: ModalAction[];
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export function AppModal({
  visible,
  title,
  message,
  actions,
  onDismiss,
  children,
}: AppModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View style={modalStyles.container}>
              <Text style={modalStyles.title}>{title}</Text>
              {message ? (
                <Text style={modalStyles.message}>{message}</Text>
              ) : null}
              {children ? (
                <ScrollView
                  style={modalStyles.childrenScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : null}
              <View style={modalStyles.actions}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      modalStyles.actionButton,
                      action.style === "destructive" &&
                        modalStyles.destructiveButton,
                      action.style === "cancel" && modalStyles.cancelButton,
                      index > 0 && { marginTop: 10 },
                    ]}
                    onPress={action.onPress}
                  >
                    <Text
                      style={[
                        modalStyles.actionText,
                        action.style === "destructive" &&
                          modalStyles.destructiveText,
                        action.style === "cancel" && modalStyles.cancelText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  childrenScroll: {
    maxHeight: 300,
    marginBottom: 8,
  },
  actions: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  destructiveButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  destructiveText: {
    color: "#FFFFFF",
  },
  cancelText: {
    color: colors.textSecondary,
  },
});
