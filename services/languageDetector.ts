
/**
 * Utility to automatically detect programming language based on code syntax patterns.
 */

interface LanguagePattern {
  lang: string;
  patterns: RegExp[];
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    lang: 'javascript',
    patterns: [
      /\bconst\b|\blet\b|\bvar\b/,
      /\bconsole\.log\(/,
      /=>/,
      /\bexport\s+default\b/,
      /\bimport\s+.*\s+from\b/
    ]
  },
  {
    lang: 'react',
    patterns: [
      /\bimport\s+React\b/,
      /<[A-Z][a-zA-Z0-9]*\s*\/?>/, // JSX components
      /useState\s*\(|useEffect\s*\(/,
      /className=/
    ]
  },
  {
    lang: 'python',
    patterns: [
      /\bdef\s+\w+\s*\(.*\):/,
      /\bimport\s+os\b|\bimport\s+sys\b/,
      /\bfrom\s+\w+\s+import\b/,
      /\belif\b/,
      /\bif\s+__name__\s*==\s*['"]__main__['"]:/,
      /\bprint\s*\(.*\)/
    ]
  },
  {
    lang: 'java',
    patterns: [
      /\bpublic\s+class\b/,
      /\bpublic\s+static\s+void\s+main\b/,
      /\bSystem\.out\.println\(/,
      /\bprivate\s+String\b/,
      /\bimport\s+java\.\w+/
    ]
  },
  {
    lang: 'cpp',
    patterns: [
      /#include\s+<\w+>/,
      /\bstd::cout\b/,
      /\bint\s+main\s*\(/,
      /\busing\s+namespace\s+std\b/
    ]
  },
  {
    lang: 'sql',
    patterns: [
      /\bSELECT\b.*\bFROM\b/i,
      /\bINSERT\s+INTO\b/i,
      /\bUPDATE\b.*\bSET\b/i,
      /\bDELETE\s+FROM\b/i,
      /\bCREATE\s+TABLE\b/i,
      /\bWHERE\b.*\b=\b/i
    ]
  },
  {
    lang: 'bash',
    patterns: [
      /#! \/bin\/bash/,
      /#! \/bin\/sh/,
      /\becho\s+["']/,
      /\bif\s+\[\s+.*\s+\]\s+then\b/,
      /\bsudo\s+\w+/
    ]
  },
  {
    lang: 'html',
    patterns: [
      /<!DOCTYPE html>/i,
      /<html/i,
      /<head/i,
      /<body/i,
      /<div|<span>|<p/i
    ]
  },
  {
    lang: 'css',
    patterns: [
      /\bmargin:\s*\d+/,
      /\bpadding:\s*\d+/,
      /\{[\s\S]*\}/,
      /\bdisplay:\s*(flex|block|grid|inline)\b/,
      /\bcolor:\s*#[a-fA-F0-9]{3,6}\b/
    ]
  }
];

export const detectLanguage = (code: string): string | null => {
  if (!code || code.trim().length < 5) return null;

  const results: Record<string, number> = {};

  LANGUAGE_PATTERNS.forEach(({ lang, patterns }) => {
    let score = 0;
    patterns.forEach(pattern => {
      if (pattern.test(code)) {
        score++;
      }
    });
    if (score > 0) {
      results[lang] = score;
    }
  });

  // Find the language with the highest score
  let bestLang: string | null = null;
  let maxScore = 0;

  Object.entries(results).forEach(([lang, score]) => {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  });

  return bestLang;
};
