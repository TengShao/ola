const test = require('node:test');
const assert = require('node:assert/strict');

const Scanner = require('../src/scanner');

test('extractExistingTags supports Chinese and hierarchical tags', () => {
  const scanner = new Scanner('/tmp');
  const content = [
    '#AI',
    '#笔记',
    '#编程/JavaScript',
    '#项目-管理'
  ].join(' ');

  assert.deepEqual(scanner.extractExistingTags(content), [
    '#AI',
    '#笔记',
    '#编程/JavaScript',
    '#项目-管理'
  ]);
});

test('renameTagInDoc only renames the exact tag token', () => {
  const scanner = new Scanner('/tmp');
  const content = [
    '---',
    '',
    '**标签：** #AI #AIML #笔记',
    '',
    '正文里提到 #AI，但不应该改掉 #AIML。'
  ].join('\n');

  const updated = scanner.renameTagInDoc(content, '#AI', '#人工智能');

  assert.match(updated, /\*\*标签：\*\* #人工智能 #AIML #笔记/);
  assert.match(updated, /正文里提到 #AI，但不应该改掉 #AIML。/);
});

test('removeTagFromDoc preserves markdown structure', () => {
  const scanner = new Scanner('/tmp');
  const content = [
    '# 标题',
    '',
    '- 列表项一',
    '- 列表项二',
    '',
    '---',
    '',
    '**标签：** #AI #笔记',
    ''
  ].join('\n');

  const updated = scanner.removeTagFromDoc(content, '#AI');

  assert.match(updated, /# 标题\n\n- 列表项一\n- 列表项二/);
  assert.match(updated, /\*\*标签：\*\* #笔记/);
  assert.doesNotMatch(updated, /#AI/);
});

test('removeTagFromDoc removes the generated tag section when the last tag is deleted', () => {
  const scanner = new Scanner('/tmp');
  const content = [
    '正文第一段',
    '',
    '---',
    '',
    '**标签：** #AI',
    ''
  ].join('\n');

  const updated = scanner.removeTagFromDoc(content, '#AI');

  assert.equal(updated, '正文第一段');
});
