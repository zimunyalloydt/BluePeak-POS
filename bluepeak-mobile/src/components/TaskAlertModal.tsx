import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Task } from "../services/taskService";

type Props = {
    task: Task | null;
    visible: boolean;
    completing: boolean;
    onComplete: () => void;
};

export default function TaskAlertModal({
    task,
    visible,
    completing,
    onComplete,
}: Props) {
    if (!task) {
        return null;
    }

    const priority = task.priority?.toUpperCase();

    const priorityLabel =
        priority === "HIGH"
            ? "HIGH PRIORITY"
            : priority === "MEDIUM"
                ? "MEDIUM PRIORITY"
                : "TASK ASSIGNED";

    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleString()
        : "No due date";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {
                // Intentionally disabled.
                // The cashier must complete the task.
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.warningCircle}>
                        <Text style={styles.warningIcon}>
                            !
                        </Text>
                    </View>

                    <Text style={styles.alertTitle}>
                        TASK ASSIGNED
                    </Text>

                    <Text style={styles.taskTitle}>
                        {task.title}
                    </Text>

                    <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>
                            {priorityLabel}
                        </Text>
                    </View>

                    <Text style={styles.description}>
                        {task.description}
                    </Text>

                    <View style={styles.dueBox}>
                        <Text style={styles.dueLabel}>
                            DUE
                        </Text>

                        <Text style={styles.dueDate}>
                            {formattedDueDate}
                        </Text>
                    </View>

                    <Text style={styles.instruction}>
                        This task must be completed before
                        you can continue.
                    </Text>

                    <Pressable
                        onPress={onComplete}
                        disabled={completing}
                        style={({ pressed }) => [
                            styles.completeButton,
                            pressed &&
                                styles.completeButtonPressed,
                            completing &&
                                styles.completeButtonDisabled,
                        ]}
                    >
                        {completing ? (
                            <ActivityIndicator
                                color="#FFFFFF"
                            />
                        ) : (
                            <Text
                                style={
                                    styles.completeButtonText
                                }
                            >
                                ✓  MARK COMPLETED
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modal: {
        width: "100%",
        maxWidth: 600,
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        padding: 30,
        alignItems: "center",
        borderWidth: 5,
        borderColor: "#DC2626",
        elevation: 20,
        shadowColor: "#000000",
        shadowOpacity: 0.35,
        shadowRadius: 30,
        shadowOffset: {
            width: 0,
            height: 15,
        },
    },

    warningCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#DC2626",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
    },

    warningIcon: {
        color: "#FFFFFF",
        fontSize: 44,
        fontWeight: "900",
    },

    alertTitle: {
        color: "#DC2626",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 1.5,
    },

    taskTitle: {
        marginTop: 12,
        color: "#111827",
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
    },

    priorityBadge: {
        marginTop: 16,
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
    },

    priorityText: {
        color: "#B91C1C",
        fontSize: 13,
        fontWeight: "900",
    },

    description: {
        marginTop: 22,
        color: "#374151",
        fontSize: 17,
        lineHeight: 25,
        textAlign: "center",
    },

    dueBox: {
        width: "100%",
        marginTop: 22,
        backgroundColor: "#FEF2F2",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
    },

    dueLabel: {
        color: "#991B1B",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1,
    },

    dueDate: {
        marginTop: 5,
        color: "#7F1D1D",
        fontSize: 16,
        fontWeight: "800",
        textAlign: "center",
    },

    instruction: {
        marginTop: 20,
        color: "#6B7280",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 19,
    },

    completeButton: {
        width: "100%",
        height: 58,
        marginTop: 24,
        borderRadius: 16,
        backgroundColor: "#DC2626",
        alignItems: "center",
        justifyContent: "center",
    },

    completeButtonPressed: {
        opacity: 0.8,
    },

    completeButtonDisabled: {
        opacity: 0.65,
    },

    completeButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
});