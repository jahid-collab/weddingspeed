
import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { Stack, useRouter } from "expo-router";
import { authenticatedPost } from "@/utils/api";
import { AppModal } from "@/components/LoadingButton";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [speechType, setSpeechType] = useState("");
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [keyMemories, setKeyMemories] = useState("");
  const [tone, setTone] = useState("");
  const [duration, setDuration] = useState("");
  const [generatedSpeech, setGeneratedSpeech] = useState("");
  const [currentSpeechId, setCurrentSpeechId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const speechTypes = [
    { id: "best_man", label: "Best Man", icon: "person" },
    { id: "maid_of_honor", label: "Maid of Honor", icon: "favorite" },
    { id: "groom", label: "Groom", icon: "person" },
    { id: "bride", label: "Bride", icon: "favorite" },
    { id: "parent", label: "Parent", icon: "group" },
    { id: "friend", label: "Friend", icon: "group" },
  ];

  const tones = [
    { id: "funny", label: "Funny" },
    { id: "heartfelt", label: "Heartfelt" },
    { id: "formal", label: "Formal" },
    { id: "casual", label: "Casual" },
  ];

  const durations = [
    { id: "short", label: "Short (2-3 min)" },
    { id: "medium", label: "Medium (4-5 min)" },
    { id: "long", label: "Long (6-8 min)" },
  ];

  const handleGenerate = async () => {
    console.log("User tapped Generate Speech button");

    if (!speechType || !groomName || !brideName || !tone || !duration) {
      showError("Missing Fields", "Please fill in Speech Type, Groom's Name, Bride's Name, Tone, and Duration before generating.");
      return;
    }

    setLoading(true);
    setGeneratedSpeech("");
    setCurrentSpeechId(null);

    try {
      console.log("[API] Requesting /api/speeches/generate...");
      const result = await authenticatedPost<{ speech: string; speechId: string }>(
        "/api/speeches/generate",
        {
          speechType,
          groomName,
          brideName,
          relationship,
          keyMemories,
          tone,
          duration,
        }
      );
      console.log("[API] Speech generated successfully, id:", result.speechId);
      setGeneratedSpeech(result.speech);
      setCurrentSpeechId(result.speechId);
    } catch (error: any) {
      console.error("[API] Failed to generate speech:", error);
      showError("Generation Failed", error.message || "Failed to generate speech. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    console.log("User tapped Reset button");
    setSpeechType("");
    setGroomName("");
    setBrideName("");
    setRelationship("");
    setKeyMemories("");
    setTone("");
    setDuration("");
    setGeneratedSpeech("");
    setCurrentSpeechId(null);
  };

  const selectedSpeechTypeLabel = speechTypes.find(t => t.id === speechType)?.label || "";
  const selectedToneLabel = tones.find(t => t.id === tone)?.label || "";
  const selectedDurationLabel = durations.find(t => t.id === duration)?.label || "";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={async () => {
                  console.log("User tapped Sign Out");
                  await signOut();
                  router.replace("/auth");
                }}
              >
                <IconSymbol
                  ios_icon_name="rectangle.portrait.and.arrow.right"
                  android_material_icon_name="logout"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <IconSymbol 
              ios_icon_name="heart.fill" 
              android_material_icon_name="favorite" 
              size={48} 
              color={colors.primary} 
            />
            <Text style={styles.title}>Wedding Speech Writer</Text>
            <Text style={styles.subtitle}>Create the perfect speech with AI</Text>
          </View>

          {!generatedSpeech ? (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Speech Type</Text>
              <View style={styles.optionsGrid}>
                {speechTypes.map((type) => {
                  const isSelected = speechType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                      onPress={() => {
                        console.log("Selected speech type:", type.id);
                        setSpeechType(type.id);
                      }}
                    >
                      <IconSymbol
                        ios_icon_name={type.icon}
                        android_material_icon_name={type.icon}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Couple Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Groom's Name"
                placeholderTextColor={colors.textSecondary}
                value={groomName}
                onChangeText={setGroomName}
              />
              <TextInput
                style={styles.input}
                placeholder="Bride's Name"
                placeholderTextColor={colors.textSecondary}
                value={brideName}
                onChangeText={setBrideName}
              />
              <TextInput
                style={styles.input}
                placeholder="Your Relationship (e.g., brother, best friend)"
                placeholderTextColor={colors.textSecondary}
                value={relationship}
                onChangeText={setRelationship}
              />

              <Text style={styles.sectionTitle}>Key Memories</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share some memorable moments or stories..."
                placeholderTextColor={colors.textSecondary}
                value={keyMemories}
                onChangeText={setKeyMemories}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.sectionTitle}>Tone</Text>
              <View style={styles.optionsRow}>
                {tones.map((t) => {
                  const isSelected = tone === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => {
                        console.log("Selected tone:", t.id);
                        setTone(t.id);
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.optionsRow}>
                {durations.map((d) => {
                  const isSelected = duration === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => {
                        console.log("Selected duration:", d.id);
                        setDuration(d.id);
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                onPress={handleGenerate}
                disabled={loading || !speechType || !groomName || !brideName || !tone || !duration}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol
                      ios_icon_name="sparkles"
                      android_material_icon_name="auto-awesome"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.generateButtonText}>Generate Speech</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.resultTitle}>Your Speech is Ready!</Text>
              </View>

              <View style={styles.resultMeta}>
                <Text style={styles.metaText}>
                  {selectedSpeechTypeLabel}
                </Text>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaText}>
                  {selectedToneLabel}
                </Text>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaText}>
                  {selectedDurationLabel}
                </Text>
              </View>

              <View style={styles.speechCard}>
                <ScrollView style={styles.speechScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.speechText}>{generatedSpeech}</Text>
                </ScrollView>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                  <IconSymbol
                    ios_icon_name="arrow.counterclockwise"
                    android_material_icon_name="refresh"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.secondaryButtonText}>Create Another</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  signOutButton: {
    padding: 8,
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
  form: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  optionCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultContainer: {
    width: "100%",
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 8,
  },
  resultMeta: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  metaDivider: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  speechCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  speechScroll: {
    flex: 1,
  },
  speechText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
  },
  actionButtons: {
    marginTop: 24,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
