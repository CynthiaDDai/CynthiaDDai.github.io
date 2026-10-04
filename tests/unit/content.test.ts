import { describe, expect, it } from 'vitest';
import { buildContentTree, ignoredContentName, invalidContentPaths, type ContentSource } from '../../src/lib/content/tree';
import { listChildren, pathFromUrl, resolvePath } from '../../src/lib/navigation/filesystem';
import { searchEntries } from '../../src/lib/search';
import { autocomplete } from '../../src/lib/terminal/autocomplete';
import { executeCommand, type CommandContext } from '../../src/lib/terminal/registry';
import { fastfetch } from '../../src/lib/theme/fastfetch-config';

describe('filesystem-native content tree', () => {
  it('accepts only lowercase hyphenated names and ignores dot and underscore names', () => {
    expect(invalidContentPaths([
      'notes/ok-post.md', 'research/machine-learning/index.mdx', '404.md', 'a1/b2.md',
      '研究/hello.md', 'notes/hello world.md', 'notes/c#-tips.md', 'notes/why?.md', 'Blog/post.md',
      'notes/Post.md', 'notes/double--hyphen.md', 'notes/-leading.md', 'notes/snake_case.md', 'notes/v1.2.md',
    ])).toEqual([
      '研究/hello.md', 'notes/hello world.md', 'notes/c#-tips.md', 'notes/why?.md', 'Blog/post.md',
      'notes/Post.md', 'notes/double--hyphen.md', 'notes/-leading.md', 'notes/snake_case.md', 'notes/v1.2.md',
    ]);
    expect(['.obsidian', '_assets', '_draft.md'].every(ignoredContentName)).toBe(true);
    expect(ignoredContentName('notes')).toBe(false);
    expect(pathFromUrl('/bad%escape')).toBe('/bad%escape');
  });
  it('derives root documents, arbitrary sections and nested routes without metadata, and never empty directories', () => {
    const tree = buildContentTree([
      { id: 'my-cool-page.md', data: {}, body: 'Hello world.' },
      { id: 'research/machine-learning/attention.md', data: {}, body: 'Softmax normalization.' },
      { id: 'drafts-only/post.md', data: { draft: true } },
    ]);
    expect(tree.nodes.map(node => node.path)).toEqual(['/', '/research', '/research/machine-learning', '/research/machine-learning/attention', '/my-cool-page']);
    expect(tree.nodes.find(node => node.path === '/my-cool-page')?.title).toBe('My Cool Page');
    expect(tree.nodes.find(node => node.path === '/research/machine-learning')?.title).toBe('Machine Learning');
    expect(tree.root.children.map(node => node.path)).toEqual(listChildren('/', tree.entries).map(entry => entry.path));
    expect(searchEntries('softmax', tree.entries).map(entry => entry.path)).toEqual(['/research/machine-learning/attention']);
    expect(searchEntries('machine learning', tree.entries)[0].path).toBe('/research/machine-learning');
    expect(autocomplete('cd re', '/', tree.entries, [])).toEqual(['cd research/']);
    expect(autocomplete('cd research/', '/', tree.entries, [])).toEqual(['cd research/machine-learning/']);
  });

  it('merges explicit indexes into their directory and indexes only their own body', () => {
    const tree = buildContentTree([
      { id: 'index.md', data: { title: 'Welcome' }, body: 'Root introduction.' },
      { id: 'research/index.md', data: { title: 'Research lab', description: 'Experiments', show_children: false, tags: ['science'] }, body: 'Independent introduction.' },
      { id: 'research/post.md', data: {}, body: 'Distinctive child prose.' },
    ]);
    const directory = tree.nodes.find(node => node.path === '/research');
    expect(directory?.kind).toBe('directory');
    if (directory?.kind === 'directory') {
      expect(directory.index.source).toBe('explicit');
      expect(directory.frontmatter.show_children).toBe(false);
      expect(directory.children.map(node => node.path)).toEqual(['/research/post']);
    }
    expect(tree.nodes.some(node => node.path.endsWith('/index'))).toBe(false);
    expect(searchEntries('independent', tree.entries).map(entry => entry.path)).toEqual(['/research']);
    expect(searchEntries('distinctive', tree.entries).map(entry => entry.path)).toEqual(['/research/post']);
    expect(searchEntries('science', tree.entries).map(entry => entry.path)).toEqual(['/research']);
    expect(searchEntries('root introduction', tree.entries).map(entry => entry.path)).toEqual(['/']);
  });

  it('requires every child of a grouped directory to carry a listed status', () => {
    const groups = { Publication: 'Publications', Preprint: 'Preprints' };
    expect(() => buildContentTree([
      { id: 'research/index.md', data: { groups } },
      { id: 'research/a.md', data: { status: 'Preprint' } },
      { id: 'research/b.md', data: { status: 'Published' } },
      { id: 'research/c.md', data: {} },
    ])).toThrow(/research\/b\.md: status "Published" is not one of Publication, Preprint[\s\S]*research\/c\.md: status null/);
    const tree = buildContentTree([
      { id: 'research/index.md', data: { groups } },
      { id: 'research/a.md', data: { status: 'Preprint' } },
      { id: 'notes/free.md', data: {} },
    ]);
    expect(tree.nodes.map(node => node.path)).toContain('/research/a');
  });

  it('refuses a draft root index, which would exclude the whole site', () => {
    expect(() => buildContentTree([{ id: 'index.md', data: { draft: true } }, { id: 'about.md', data: {} }])).toThrow(/root index\.md would exclude the whole site/);
  });

  it('omits drafts and draft sections entirely, and rejects the removed hidden flag', () => {
    const tree = buildContentTree([
      { id: 'visible.md', data: {}, body: 'Visible prose.' },
      { id: 'secret.md', data: { draft: true }, body: 'Draft needle.' },
      { id: 'private/index.md', data: { draft: true } },
      { id: 'private/nested/post.md', data: {}, body: 'Draft needle.' },
      { id: 'draft-only/post.md', data: { draft: true } },
    ]);
    expect(tree.entries.map(entry => entry.path)).toEqual(['/', '/visible']);
    expect(resolvePath('~/private/nested/post', '/', tree.entries)).toBeUndefined();
    expect(searchEntries('draft needle', tree.entries)).toEqual([]);
    expect(autocomplete('cd ', '/', tree.entries, [])).toEqual(['cd visible']);
    expect(() => buildContentTree([{ id: 'old.md', data: { hidden: true } }])).toThrow('Use draft: true');
  });

  it('sorts by explicit order, then directories and dated documents, with an alphabetical fallback', () => {
    const sources: ContentSource[] = [
      { id: 'z.md', data: { order: -1 } }, { id: 'a.md', data: {} },
      { id: 'section/index.md', data: {} },
      { id: 'section/old.md', data: { date: new Date('2025-01-01') } },
      { id: 'section/new.md', data: { date: new Date('2026-01-01') } },
    ];
    const tree = buildContentTree(sources);
    expect(listChildren('/', tree.entries).map(entry => entry.path)).toEqual(['/z', '/section', '/a']);
    expect(listChildren('/section', tree.entries).map(entry => entry.path)).toEqual(['/section/new', '/section/old']);
    expect(buildContentTree([...sources].reverse()).entries).toEqual(tree.entries);
    const mixed = buildContentTree([...sources, { id: 'section/alpha.md', data: {} }]);
    expect(listChildren('/section', mixed.entries).map(entry => entry.path)).toEqual(['/section/alpha', '/section/new', '/section/old']);
  });

  it('rejects competing sources, document/directory collisions and system routes', () => {
    expect(() => buildContentTree([{ id: 'foo.md', data: {} }, { id: 'foo.mdx', data: {} }])).toThrow('Multiple content sources');
    expect(() => buildContentTree([{ id: 'foo/index.md', data: {} }, { id: 'foo/index.mdx', data: {} }])).toThrow('Multiple index documents');
    expect(() => buildContentTree([{ id: 'foo.md', data: {} }, { id: 'foo/post.md', data: {} }])).toThrow('both a document and a directory');
    expect(() => buildContentTree([{ id: '404.md', data: {} }])).toThrow('reserved');
    expect(() => buildContentTree([{ id: '404/post.md', data: {} }])).toThrow('reserved');
  });

  it('automatically counts new sections in fastfetch and keeps drafts out of statistics', () => {
    const tree = buildContentTree([
      { id: 'research/post.md', data: {} },
      { id: 'research/nested/post.md', data: { date: new Date('2026-01-01') } },
      { id: 'research/secret.md', data: { draft: true } },
    ]);
    const context: CommandContext = {
      entries: tree.entries, cwd: '/', previousPath: null, owner: 'Owner', host: 'site', bio: '', email: '', github: '', socials: [],
      activityLimit: 3, fastfetch, friends: [], theme: { current: { id: 'storm' }, set: () => false, available: [] },
    };
    expect(executeCommand('ls research', context)).toEqual({ kind: 'list', entries: listChildren('/research', tree.entries) });
    const result = executeCommand('fastfetch', context);
    if (result.kind !== 'fastfetch') throw new Error('Expected fastfetch output');
    expect(result.sections.find(section => section.name === 'SYSTEM')?.rows).toEqual([
      { label: 'pages', value: '5' }, { label: 'research', value: '2', path: '/research' },
    ]);
  });
});
