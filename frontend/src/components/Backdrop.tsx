import React from "react";
import { StyleSheet, View } from "react-native";
import { fx, makeStyles, useUiStyle } from "@/src/theme";
import { EmberBackground } from "./Ember";

// Screen background decoration for the selected UI style; render as the first child of a screen root
export function Backdrop() {
  useUiStyle();
  const s = useStyles();
  if (fx.backdrop === "ember") return <EmberBackground />;
  if (fx.backdrop === "none") return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {fx.backdrop === "paper" ? (
        <>
          {Array.from({ length: 60 }, (_, i) => <View key={i} style={s.rule} />)}
          <View style={s.margin} />
        </>
      ) : null}
      {fx.backdrop === "grid" ? (
        <>
          {Array.from({ length: 70 }, (_, i) => <View key={`h${i}`} style={[s.gridH, { top: i * 24 }, i % 5 === 0 && s.major]} />)}
          {Array.from({ length: 50 }, (_, i) => <View key={`v${i}`} style={[s.gridV, { left: i * 24 }, i % 5 === 0 && s.major]} />)}
        </>
      ) : null}
      {fx.backdrop === "halftone" ? (
        <View style={s.dots}>
          {Array.from({ length: 420 }, (_, i) => <View key={i} style={s.dot} />)}
        </View>
      ) : null}
    </View>
  );
}

// CRT scanline overlay (Retro Arcade only); never intercepts touches
export function Scanlines() {
  useUiStyle();
  const s = useStyles();
  if (!fx.scanlines) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 300 }, (_, i) => <View key={i} style={s.scan} />)}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  rule: { height: 30, borderBottomWidth: 1, borderBottomColor: c.divider },
  margin: { position: "absolute", top: 0, bottom: 0, left: 22, width: 2, backgroundColor: c.borderStrong, opacity: 0.5 },
  gridH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: c.divider, opacity: 0.55 },
  gridV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: c.divider, opacity: 0.55 },
  major: { opacity: 1 },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: 22, padding: 11 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.divider },
  scan: { height: 1, marginBottom: 2, backgroundColor: c.arena, opacity: 0.22 },
}));
