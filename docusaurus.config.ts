import { themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';


const config: Config = {
  title: 'MedCMU-HPC',
  tagline: 'MedCMU-HPC is dedicated to providing cutting-edge computing resources for medical and health science research. ',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://medcmu-hpc.netlify.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'hpc', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  themeConfig: {
    // Replace with your project's social card
    image: 'img/medcmu-hpc-card.jpg',
    navbar: {
      title: 'MedCMU-HPC',
      logo: {
        alt: 'MedCMU-HPC Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/resources', label: 'Our Resources', position: 'left'},
        {to: '/get-access', label: 'Get Access', position: 'left'},
        {to: '/credit-calculator', label: 'Service Fee', position: 'left'},
        {label: 'Submit Form',
          items: [
            {
              label: 'User Registration',
              href: 'https://cmu.to/medcmu-hpc-user-register',
            },
            {
              label: 'Project Registration',
              href: 'https://cmu.to/medcmu-hpc-proj-register',
            },
            {
              label: 'Change Request',
              href: 'http://cmu.to/medcmu-hpc-change-req',
            },
            {
              label: 'Project Closure',
              href: 'https://cmu.to/medcmu-hpc-closure',
            }
          ]
        },
        // {to: '/change-request', label: 'Request Resources', position: 'left'},
        // {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/contact-hpc-support', label: 'Contact Us', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting started HPC',
              to: '/docs/intro',
            },
            {
              label: 'Connect HPC',
              to: '/docs/Documentation/connect-server',
            },
            {
              label: 'Transfer files with HPC',
              to: '/docs/Documentation/data-transfer',
            },
          ],
        },
        {
          title: 'Essential Unix/Linux command',
          items: [
            {
              label: 'Basic Command',
              href: '/docs/Documentation/unix-command#basic-command',
            },
            {
              label: 'Use Environmental-modules',
              href: '/docs/Documentation/environment-modules',
            },
            {
              label: 'Virtual Environment',
              href: '/docs/Documentation/virtaul-env',
            },
            {
              label: 'Use Virtual Terminal',
              href: '/docs/Documentation/virutal-screen',
            },
          ],
        },
        {
          title: 'More resource',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Faculty of Medicine, Chiang Mai University`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'r'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
