import { charmEditorPlugins } from 'components/common/CharmEditor/plugins';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import { builders as _ } from 'testing/prosemirror/builders';
import { renderTestEditor } from 'testing/prosemirror/renderTestEditor';

import { getNodeForRowPosition, rowNodeAtPos } from '../rowActions';

const testEditor = renderTestEditor({
  specRegistry,
  plugins: charmEditorPlugins()
});

describe('rowNodeAtPos() returns the DOM node given a position in the prosemirror document', () => {
  test('When pos is inside a text node, returns the parent paragraph', () => {
    const doc = _.doc(_.p('hello world'));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 3);
    const paragraphNode = editor.view.dom.children[0];
    expect(result?.rowNode).toBe(paragraphNode);
  });

  test('When pos is inside text inside a column, returns the paragraph node', () => {
    const doc = _.doc(_.columnLayout(_.columnBlock(_.p('hello world'))));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 5);
    expect(result?.node.pmViewDesc?.node?.type.name).toBe('text');
    expect(result?.rowNode.pmViewDesc?.node?.type.name).toBe('paragraph');
  });

  test('When pos is on a column block, returns the first child', () => {
    const doc = _.doc(_.columnLayout(_.columnBlock(_.p('hello world'))));
    const editor = testEditor(doc);
    const result = rowNodeAtPos(editor.view, 2);
    expect(result?.node.pmViewDesc?.node?.type.name).toBe('columnBlock');
    expect(result?.rowNode.pmViewDesc?.node?.type.name).toBe('paragraph');
  });
});

describe('getNodeForRowPosition() returns node and its position based on row position', () => {
  test('Return node at given row', () => {
    const nodes = [_.p('hello world'), _.blockquote(_.p('some quote')), _.p(_.hardBreak()), _.img()];
    const doc = _.doc(...nodes);

    const editor = testEditor(doc);
    const result = getNodeForRowPosition({ view: editor.view, rowPosition: 0 });
    expect(result?.node.type.name).toBe('doc');

    const result2 = getNodeForRowPosition({ view: editor.view, rowPosition: 1 });

    expect(result2?.node.type.name).toBe('paragraph');
    expect(result2?.nodeStart).toBe(1);
    expect(result2?.nodeEnd).toBe(13);

    const result3 = getNodeForRowPosition({ view: editor.view, rowPosition: 2 });
    expect(result3?.node.type.name).toBe('blockquote');

    const result4 = getNodeForRowPosition({ view: editor.view, rowPosition: 3 });
    expect(result4?.node.type.name).toBe('doc');
  });
});
