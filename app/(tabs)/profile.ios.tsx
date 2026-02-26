
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import React, { useState, useCallback } from "react";
import { Stack, useFocusEffect } from "expo-router";
import { authenticatedGet, authenticatedDelete } from "@/utils/api";
import { AppModal } from "@/components/LoadingButton";

interface Speech {
  id: string;
  speechType: string;
  groomName: string;
  brideName: string;
  relationship?: string;
  keyMemories?: string;
  tone?: string;
  duration?: string;
  generatedSpeech: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; speechId: string | null }>({
    visible: false,
    speechId: null,
  });

  const [viewModal, setViewModal] = useState<{ visible: boolean; speech: Speech | null }>({
    visible: false,
    speech: null,
  });

  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const fetchSpeeches = async () => {
    setLoading(true);
    try {
      console.log("[API] Requesting /api/speeches...");
      const data = await authenticatedGet<Speech[]>("/api/speeches");
      console.log("[API] Fetched speeches:", data.length);
      setSpeeches(data);
    } catch (error: any) {
      console.error("[API] Failed to fetch speeches:", error);
      showError("Failed to Load", error.message || "Could not load your speeches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSpeeches();
    }, [])
  );

  const handleDeleteConfirm = async () => {
    if (!deleteModal.speechId) return;
    const id = deleteModal.speechId;
    setDeleteModal({ visible: false, speechId: null });
    setDeletingId(id);

    try {
      console.log("[API] Requesting DELETE /api/speeches/" + id);
      await authenticatedDelete(`/api/speeches/${id}`);
      console.log("[API] Speech deleted:", id);
      setSpeeches((prev) => prev.filter((s) => s.id !== id));
    } catch (error: any) {
      console.error("[API] Failed to delete speech:", error);
      showError("Delete Failed", error.message || "Could not delete the speech. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getSpeechTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      best_man: "Best Man",
      maid_of_honor: "Maid of Honor",
      groom: "Groom",
      bride: "Bride",
      parent: "Parent",
      friend: "Friend",
    };
    return labels[type] || type;
  };

  const getToneLabel = (tone?: string) => {
    const labels: Record<string, string> = {
      funny: "Funny",
      heartfelt: "Heartfelt",
      formal: "Formal",
      casual: "Casual",
    };
    return tone ? (labels[tone] || tone) : "";
  };

  const getDurationLabel = (duration?: string) => {
    const labels: Record<string, string> = {
      short: "Short (2-3 min)",
      medium: "Medium (4-5 min)",
      long: "Long (6-8 min)",
    };
    return duration ? (labels[duration] || duration) : "";
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="clock.fill" 
            android_material_icon_name="history" 
            size={32} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Speech History</Text>
          <Text style={styles.subtitle}>Your saved speeches</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : speeches.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol 
                ios_icon_name="doc.text" 
                android_material_icon_name="description" 
                size={64} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyStateText}>No speeches yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first wedding speech to see it here</Text>
            </View>
          ) : (
            speeches.map((speech) => {
              const speechTypeLabel = getSpeechTypeLabel(speech.speechType);
              const dateDisplay = formatDate(speech.createdAt);
              const previewText = speech.generatedSpeech.substring(0, 150);
              const previewDisplay = previewText + "...";
              const isDeleting = deletingId === speech.id;
              
              return (
                <TouchableOpacity 
                  key={speech.id}
                  style={styles.speechCard}
                  onPress={() => {
                    console.log("Tapped speech:", speech.id);
                    setViewModal({ visible: true, speech });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.speechHeader}>
                    <View style={styles.speechTypeContainer}>
                      <IconSymbol 
                        ios_icon_name="heart.fill" 
                        android_material_icon_name="favorite" 
                        size={20} 
                        color={colors.primary} 
                      />
                      <Text style={styles.speechType}>{speechTypeLabel}</Text>
                    </View>
                    <Text style={styles.speechDate}>{dateDisplay}</Text>
                  </View>
                  
                  <Text style={styles.speechCouple}>{speech.groomName}</Text>
                  <Text style={styles.speechCoupleAnd}>&</Text>
                  <Text style={styles.speechCouple}>{speech.brideName}</Text>
                  
                  <Text style={styles.speechPreview}>{previewDisplay}</Text>
                  
                  <View style={styles.speechFooter}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        console.log("View speech:", speech.id);
                        setViewModal({ visible: true, speech });
                      }}
                    >
                      <IconSymbol 
                        ios_icon_name="eye" 
                        android_material_icon_name="visibility" 
                        size={18} 
                        color={colors.primary} 
                      />
                      <Text style={styles.actionButtonText}>View</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      disabled={isDeleting}
                      onPress={() => {
                        console.log("Delete speech tapped:", speech.id);
                        setDeleteModal({ visible: true, speechId: speech.id });
                      }}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <>
                          <IconSymbol 
                            ios_icon_name="trash" 
                            android_material_icon_name="delete" 
                            size={18} 
                            color="#FF3B30" 
                          />
                          <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <AppModal
          visible={deleteModal.visible}
          title="Delete Speech"
          message="Are you sure you want to delete this speech? This action cannot be undone."
          onDismiss={() => setDeleteModal({ visible: false, speechId: null })}
          actions={[
            {
              label: "Delete",
              onPress: handleDeleteConfirm,
              style: "destructive",
            },
            {
              label: "Cancel",
              onPress: () => setDeleteModal({ visible: false, speechId: null }),
              style: "cancel",
            },
          ]}
        />

        {/* View Speech Modal */}
        <AppModal
          visible={viewModal.visible}
          title={
            viewModal.speech
              ? `${getSpeechTypeLabel(viewModal.speech.speechType)} Speech`
              : "Speech"
          }
          message={
            viewModal.speech
              ? `${viewModal.speech.groomName} & ${viewModal.speech.brideName}${viewModal.speech.tone ? `  •  ${getToneLabel(viewModal.speech.tone)}` : ""}${viewModal.speech.duration ? `  •  ${getDurationLabel(viewModal.speech.duration)}` : ""}`
              : undefined
          }
          onDismiss={() => setViewModal({ visible: false, speech: null })}
          actions={[
            {
              label: "Close",
              onPress: () => setViewModal({ visible: false, speech: null }),
              style: "cancel",
            },
          ]}
        >
          {viewModal.speech ? (
            <Text style={styles.speechFullText}>{viewModal.speech.generatedSpeech}</Text>
          ) : null}
        </AppModal>

        {/* Error Modal */}
        <AppModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onDismiss={() => setErrorModal({ ...errorModal, visible: false })}
          actions={[
            {
              label: "OK",
              onPress: () => setErrorModal({ ...errorModal, visible: false }),
              style: "default",
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  speechCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  speechTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speechType: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  speechDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  speechCouple: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  speechCoupleAnd: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: 4,
  },
  speechPreview: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  speechFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  speechFullText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    paddingVertical: 8,
  },
});
