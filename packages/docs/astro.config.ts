import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import remarkDirective from 'remark-directive';
import { fixInternalLinks } from './remark/fixInternalLinks.ts';
import { transformDirectives } from './remark/transformDirectives.ts';
import type { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';

const setForeground = (theme: ExpressiveCodeTheme, scope: string, value: string) => {
  const settings = theme.settings.find(setting => setting.scope?.includes(scope));
  if (settings) settings.settings.foreground = value;
};

export default defineConfig({
  site: 'https://knip.dev',
  base: '/',
  // @ts-expect-error TODO
  sitemap: false,
  trailingSlash: 'never',
  markdown: {
    remarkPlugins: [fixInternalLinks, transformDirectives, remarkDirective],
  },
  integrations: [
    starlight({
      title: 'knip.dev',
      logo: {
        light: './src/assets/title-light.svg',
        dark: './src/assets/title-dark.svg',
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/webpro-nl/knip',
        discord: 'https://discord.gg/r5uXTtbTpc',
        'x.com': 'https://x.com/webprolific',
      },
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css', './src/fonts/font-face.css'],
      editLink: {
        baseUrl: 'https://github.com/webpro-nl/knip/edit/v4/packages/docs/',
      },
      sidebar: [
        {
          label: 'Overview',
          autogenerate: { directory: 'overview' },
        },
        {
          label: 'Understanding Knip',
          autogenerate: { directory: 'explanations' },
        },
        {
          label: 'Features',
          autogenerate: { directory: 'features' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'Blog',
          autogenerate: { directory: 'blog' },
        },
      ],
      expressiveCode: {
        emitExternalStylesheet: true,
        styleOverrides: {
          // @ts-expect-error TODO
          'frm-tooltipSuccessBg': 'var(--sl-color-orange)',
          'frm-tooltipSuccessFg': 'var(--sl-color-white)',
        },
        frames: {
          showCopyToClipboardButton: true,
        },
        themes: ['min-dark'],
        customizeTheme: theme => {
          setForeground(theme, 'entity.name.tag', '#f68a22');
          setForeground(theme, 'entity.name.type', '#ededed');
          setForeground(theme, 'string', '#ededed');
          return theme;
        },
      },
    }),
  ],
});
