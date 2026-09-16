import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSession, onAuthStateChange, requestEmailCode, signOut, verifyEmailCode } from "../src/cloud/auth";
import { syncNow } from "../src/cloud/backup";
import { isCloudConfigured } from "../src/cloud/config";
import { getLastSyncedAt } from "../src/cloud/syncState";
import { useTheme } from "../src/theme";

type Step = "email" | "code";

export default function BackupScreen() {
  const theme = useTheme();
  const configured = isCloudConfigured();

  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(null);

  const refreshSyncedAt = useCallback(() => {
    getLastSyncedAt().then(setLastSyncedAtState);
  }, []);

  useEffect(() => {
    if (!configured) return;
    getSession().then(setSession);
    refreshSyncedAt();
    return onAuthStateChange(setSession);
  }, [configured, refreshSyncedAt]);

  async function handleSendCode() {
    setBusy(true);
    setError(null);
    const { error: err } = await requestEmailCode(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setStep("code");
  }

  async function handleVerifyCode() {
    setBusy(true);
    setError(null);
    const { error: err } = await verifyEmailCode(email.trim(), code.trim());
    setBusy(false);
    if (err) setError(err);
  }

  async function handleSyncNow() {
    setBusy(true);
    setError(null);
    const { error: err } = await syncNow();
    setBusy(false);
    if (err) setError(err);
    else refreshSyncedAt();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>Backup</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.colors.textSecondary }}>Done</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
        {!configured ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Cloud backup isn't set up for this build yet. Your wardrobe stays fully on this device — see
            README.md "Cloud backup setup" to enable it.
          </Text>
        ) : session ? (
          <SignedInView
            email={session.user.email ?? ""}
            busy={busy}
            lastSyncedAt={lastSyncedAt}
            onSyncNow={handleSyncNow}
            onSignOut={() => signOut()}
          />
        ) : step === "email" ? (
          <>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Back up your wardrobe so it survives a lost phone. We'll email you a code — no password.
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                height: 44,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.surfaceSecondary,
                color: theme.colors.textPrimary,
              }}
            />
            <PrimaryButton label="Send code" busy={busy} disabled={!email.trim()} onPress={handleSendCode} />
          </>
        ) : (
          <>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Enter the code we sent to {email}.
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="number-pad"
              style={{
                height: 44,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.surfaceSecondary,
                color: theme.colors.textPrimary,
              }}
            />
            <PrimaryButton label="Verify" busy={busy} disabled={!code.trim()} onPress={handleVerifyCode} />
            <Pressable onPress={() => setStep("email")}>
              <Text style={{ color: theme.colors.textSecondary, textAlign: "center" }}>Use a different email</Text>
            </Pressable>
          </>
        )}

        {error && <Text style={{ color: theme.colors.danger }}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}

function SignedInView({
  email,
  busy,
  lastSyncedAt,
  onSyncNow,
  onSignOut,
}: {
  email: string;
  busy: boolean;
  lastSyncedAt: string | null;
  onSyncNow: () => void;
  onSignOut: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>Signed in as {email}</Text>
      <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary }]}>
        {lastSyncedAt ? `Last backed up ${new Date(lastSyncedAt).toLocaleString()}` : "Not backed up yet"}
      </Text>
      <PrimaryButton label="Sync now" busy={busy} onPress={onSyncNow} />
      <Pressable onPress={onSignOut} style={{ marginTop: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.danger, textAlign: "center" }}>Sign out</Text>
      </Pressable>
    </>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={{
        height: 44,
        borderRadius: theme.radii.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.accent,
        opacity: busy || disabled ? 0.5 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator color={theme.colors.accentInverse} />
      ) : (
        <Text style={{ color: theme.colors.accentInverse, fontWeight: "600" }}>{label}</Text>
      )}
    </Pressable>
  );
}
