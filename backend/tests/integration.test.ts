import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let authToken: string;
  let generatedSpeechId: string;

  describe("Authentication & Speeches", () => {
    test("Sign up test user", async () => {
      const { token } = await signUpTestUser();
      authToken = token;
      expect(authToken).toBeDefined();
    });

    test("Generate a wedding speech - best_man", { timeout: 60000 }, async () => {
      const res = await authenticatedApi("/api/speeches/generate", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechType: "best_man",
          groomName: "John",
          brideName: "Jane",
          relationship: "College roommate",
          keyMemories: "We had great times in college, lots of funny moments",
          tone: "funny",
          duration: "medium",
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.speech).toBeDefined();
      expect(typeof data.speech).toBe("string");
      expect(data.speechId).toBeDefined();
      expect(typeof data.speechId).toBe("string");
      generatedSpeechId = data.speechId;
    });

    test("Generate a wedding speech - maid_of_honor", { timeout: 60000 }, async () => {
      const res = await authenticatedApi("/api/speeches/generate", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechType: "maid_of_honor",
          groomName: "John",
          brideName: "Jane",
          relationship: "Sister",
          keyMemories: "Growing up together, supporting each other",
          tone: "heartfelt",
          duration: "long",
        }),
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.speech).toBeDefined();
      expect(data.speechId).toBeDefined();
    });

    test("Generate speech - missing required field", async () => {
      const res = await authenticatedApi("/api/speeches/generate", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechType: "groom",
          groomName: "John",
          brideName: "Jane",
          // missing relationship, keyMemories, tone, duration
        }),
      });
      await expectStatus(res, 400);
    });

    test("Generate speech without auth", async () => {
      const res = await api("/api/speeches/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechType: "best_man",
          groomName: "John",
          brideName: "Jane",
          relationship: "Friend",
          keyMemories: "Good times",
          tone: "casual",
          duration: "short",
        }),
      });
      await expectStatus(res, 401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Get all speeches for authenticated user", async () => {
      const res = await authenticatedApi("/api/speeches", authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const speech = data[0];
        expect(speech.id).toBeDefined();
        expect(speech.speechType).toBeDefined();
        expect(speech.groomName).toBeDefined();
        expect(speech.brideName).toBeDefined();
        expect(speech.generatedSpeech).toBeDefined();
        expect(speech.createdAt).toBeDefined();
      }
    });

    test("Get all speeches without auth", async () => {
      const res = await api("/api/speeches");
      await expectStatus(res, 401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Get specific speech by ID", async () => {
      const res = await authenticatedApi(`/api/speeches/${generatedSpeechId}`, authToken);
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.id).toBe(generatedSpeechId);
      expect(data.speechType).toBeDefined();
      expect(data.groomName).toBeDefined();
      expect(data.brideName).toBeDefined();
      expect(data.relationship).toBeDefined();
      expect(data.keyMemories).toBeDefined();
      expect(data.tone).toBeDefined();
      expect(data.duration).toBeDefined();
      expect(data.generatedSpeech).toBeDefined();
      expect(data.createdAt).toBeDefined();
    });

    test("Get speech with nonexistent UUID", async () => {
      const res = await authenticatedApi("/api/speeches/00000000-0000-0000-0000-000000000000", authToken);
      await expectStatus(res, 404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Get speech with invalid UUID format", async () => {
      const res = await authenticatedApi("/api/speeches/invalid-uuid", authToken);
      await expectStatus(res, 400);
    });

    test("Get speech without auth", async () => {
      const res = await api(`/api/speeches/${generatedSpeechId}`);
      await expectStatus(res, 401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Delete speech by ID", async () => {
      const res = await authenticatedApi(`/api/speeches/${generatedSpeechId}`, authToken, {
        method: "DELETE",
      });
      await expectStatus(res, 200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test("Verify speech is deleted (404 on GET)", async () => {
      const res = await authenticatedApi(`/api/speeches/${generatedSpeechId}`, authToken);
      await expectStatus(res, 404);
    });

    test("Delete nonexistent speech", async () => {
      const res = await authenticatedApi("/api/speeches/00000000-0000-0000-0000-000000000000", authToken, {
        method: "DELETE",
      });
      await expectStatus(res, 404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Delete speech without auth", async () => {
      const res = await api(`/api/speeches/${generatedSpeechId}`, {
        method: "DELETE",
      });
      await expectStatus(res, 401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Test various speech types", { timeout: 120000 }, async () => {
      const speechTypes = ["groom", "bride", "parent", "friend"];
      for (const speechType of speechTypes) {
        const res = await authenticatedApi("/api/speeches/generate", authToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speechType,
            groomName: "John",
            brideName: "Jane",
            relationship: "Family",
            keyMemories: "Shared memories",
            tone: "formal",
            duration: "short",
          }),
        });
        await expectStatus(res, 200);
        const data = await res.json();
        expect(data.speech).toBeDefined();
        expect(data.speechId).toBeDefined();
      }
    });

    test("Test various tones", { timeout: 120000 }, async () => {
      const tones = ["funny", "heartfelt", "formal", "casual"];
      for (const tone of tones) {
        const res = await authenticatedApi("/api/speeches/generate", authToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speechType: "best_man",
            groomName: "John",
            brideName: "Jane",
            relationship: "Friend",
            keyMemories: "Great times",
            tone,
            duration: "medium",
          }),
        });
        await expectStatus(res, 200);
      }
    });

    test("Test various durations", { timeout: 120000 }, async () => {
      const durations = ["short", "medium", "long"];
      for (const duration of durations) {
        const res = await authenticatedApi("/api/speeches/generate", authToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speechType: "best_man",
            groomName: "John",
            brideName: "Jane",
            relationship: "Friend",
            keyMemories: "Great times",
            tone: "casual",
            duration,
          }),
        });
        await expectStatus(res, 200);
      }
    });
  });
});
