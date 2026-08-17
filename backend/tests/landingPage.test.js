const path = require('path');
const app = require('../app');

describe('Landing Page Multilingual Resolution & Rendering', () => {
  const { resolveLocale, findMatchingLocale, parseAcceptLanguage, renderTemplate, AVAILABLE_LOCALES } = app;

  describe('AVAILABLE_LOCALES', () => {
    test('contains expected core locales including German dialects and international languages', () => {
      const codes = AVAILABLE_LOCALES.map(l => l.code);
      expect(codes).toContain('de-DE');
      expect(codes).toContain('de-AT');
      expect(codes).toContain('de-CH');
      expect(codes).toContain('en-US');
      expect(codes).toContain('en');
      expect(codes).toContain('fr-FR');
      expect(codes).toContain('es-ES');
      expect(codes).toContain('it-IT');
    });
  });

  describe('parseAcceptLanguage', () => {
    test('parses and sorts weighted Accept-Language header correctly', () => {
      const header = 'en-US,en;q=0.8,de-DE;q=0.9,fr;q=0.5';
      const parsed = parseAcceptLanguage(header);
      expect(parsed).toEqual([
        { lang: 'en-US', q: 1.0 },
        { lang: 'de-DE', q: 0.9 },
        { lang: 'en', q: 0.8 },
        { lang: 'fr', q: 0.5 },
      ]);
    });

    test('handles empty or missing header', () => {
      expect(parseAcceptLanguage('')).toEqual([]);
      expect(parseAcceptLanguage(null)).toEqual([]);
    });
  });

  describe('findMatchingLocale', () => {
    test('matches exact locale codes case-insensitively', () => {
      expect(findMatchingLocale('de-DE')).toBe('de-DE');
      expect(findMatchingLocale('de-de')).toBe('de-DE');
      expect(findMatchingLocale('en-us')).toBe('en-US');
      expect(findMatchingLocale('de-AT')).toBe('de-AT');
      expect(findMatchingLocale('fr-FR')).toBe('fr-FR');
    });

    test('maps primary language tags to standard locales', () => {
      expect(findMatchingLocale('de')).toBe('de-DE');
      expect(findMatchingLocale('en')).toBe('en');
      expect(findMatchingLocale('en-us')).toBe('en-US');
      expect(findMatchingLocale('fr')).toBe('fr-FR');
      expect(findMatchingLocale('es')).toBe('es-ES');
      expect(findMatchingLocale('it')).toBe('it-IT');
    });

    test('returns null for completely unsupported languages', () => {
      expect(findMatchingLocale('xx-YY')).toBeNull();
      expect(findMatchingLocale('')).toBeNull();
      expect(findMatchingLocale(null)).toBeNull();
    });
  });

  describe('resolveLocale', () => {
    test('prioritizes query parameter ?lang=', () => {
      const req = {
        query: { lang: 'fr-FR' },
        headers: {
          cookie: 'appLocale=es-ES',
          'accept-language': 'de-DE,de;q=0.9'
        }
      };
      expect(resolveLocale(req)).toBe('fr-FR');
    });

    test('prioritizes cookie if no query parameter is given', () => {
      const req = {
        query: {},
        headers: {
          cookie: 'appLocale=it-IT; other=123',
          'accept-language': 'de-DE,de;q=0.9'
        }
      };
      expect(resolveLocale(req)).toBe('it-IT');
    });

    test('uses Accept-Language header if neither query nor cookie is given', () => {
      const reqGerman = {
        query: {},
        headers: {
          'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      };
      expect(resolveLocale(reqGerman)).toBe('de-DE');

      const reqEnglish = {
        query: {},
        headers: {
          'accept-language': 'en-US,en;q=0.9,de;q=0.8'
        }
      };
      expect(resolveLocale(reqEnglish)).toBe('en-US');

      const reqSpanish = {
        query: {},
        headers: {
          'accept-language': 'es-ES,es;q=0.9'
        }
      };
      expect(resolveLocale(reqSpanish)).toBe('es-ES');
    });

    test('defaults to de-DE if no language information is provided', () => {
      const reqEmpty = {
        query: {},
        headers: {}
      };
      expect(resolveLocale(reqEmpty)).toBe('de-DE');
    });
  });

  describe('renderTemplate', () => {
    const templatePath = path.join(__dirname, '..', 'public', 'index.template.html');

    test('renders German landing page for de-DE', () => {
      const html = renderTemplate(templatePath, 'de-DE');
      expect(html).toContain('lang="de"');
      expect(html).toContain('Kostenloser KI Kalorienzähler');
      expect(html).toContain('Neuinstallationen vorübergehend pausiert');
      expect(html).toContain('Aufgrund des hohen Ansturms und aus Kostengründen');
      expect(html).toContain('store-link--disabled');
      expect(html).toContain('aria-disabled="true"');
      expect(html).toContain('id="language-select"');
      expect(html).toContain('id="i18n-calculator"');
    });

    test('renders English landing page for en-US', () => {
      const html = renderTemplate(templatePath, 'en-US');
      expect(html).toContain('lang="en"');
      expect(html).toContain('Free AI Calorie Counter');
      expect(html).toContain('New installations temporarily paused');
      expect(html).toContain('store-link--disabled');
      expect(html).toContain('aria-disabled="true"');
    });

    test('renders French landing page for fr-FR', () => {
      const html = renderTemplate(templatePath, 'fr-FR');
      expect(html).toContain('lang="fr"');
      expect(html).toContain('store-link--disabled');
      expect(html).toContain('id="i18n-calculator"');
    });

    test('falls back gracefully to de-DE for missing keys without leaving unreplaced placeholders', () => {
      const html = renderTemplate(templatePath, 'de-DY');
      expect(html).not.toMatch(/\{\{hero\./);
      expect(html).not.toMatch(/\{\{calculator\./);
      expect(html).toContain('store-link--disabled');
    });
  });
});
