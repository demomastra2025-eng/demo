"use client";

import type { FC } from "react";
import ShikiHighlighter, { type ShikiHighlighterProps } from "react-shiki";
import type { SyntaxHighlighterProps as AUIProps } from "@assistant-ui/react-markdown";
import { cn } from "@/lib/utils";

/**
 * Props for the SyntaxHighlighter component
 */
export type HighlighterProps = Omit<
  ShikiHighlighterProps,
  "children" | "theme"
> & {
  theme?: ShikiHighlighterProps["theme"];
} & Pick<AUIProps, "node" | "components" | "language" | "code">;

/**
 * SyntaxHighlighter component, using react-shiki.
 * Use it by passing to `defaultComponents` in `markdown-text.tsx`.
 */
export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = { dark: "kanagawa-wave", light: "kanagawa-lotus" },
  className,
  addDefaultStyles = false,
  showLanguage = false,
  node: _node,
  components: _components,
  ...props
}) => {
  void _node;
  void _components;

  return (
    <ShikiHighlighter
      {...props}
      language={language}
      theme={theme}
      addDefaultStyles={addDefaultStyles}
      showLanguage={showLanguage}
      defaultColor="light-dark()"
      className={cn(
        "aui-shiki-base [&_pre]:overflow-x-auto [&_pre]:rounded-b-lg [&_pre]:!bg-muted/75 [&_pre]:p-4",
        className,
      )}
    >
      {code.trim()}
    </ShikiHighlighter>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
